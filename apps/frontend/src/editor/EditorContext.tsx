import { Canvas, FabricImage, Textbox, type FabricObject } from "fabric";
import jsPDF from "jspdf";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPresetGroup, type PresetDefinition } from "./presets";
import type { ShapeId } from "./shapes";
import { SHAPE_LIBRARY } from "./shapes";

export const ARTBOARD_SIZE = 500;
const MAX_HISTORY = 50;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;

interface EditorContextValue {
  canvas: Canvas | null;
  canvasElRef: React.RefObject<HTMLCanvasElement>;
  selectedObject: FabricObject | null;
  zoom: number;
  snapEnabled: boolean;
  panMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  addShape: (shapeId: ShapeId) => void;
  addPreset: (preset: PresetDefinition) => void;
  addText: () => void;
  addImageFromFile: (file: File) => Promise<void>;
  deleteSelected: () => void;
  updateSelected: (props: Record<string, unknown>) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (value: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleSnap: () => void;
  togglePanMode: () => void;
  exportPNG: (multiplier?: number) => string;
  exportSVG: () => string;
  exportPDF: () => void;
  getCanvasJson: () => Record<string, unknown>;
  loadDesign: (json: Record<string, unknown>) => Promise<void>;
  resetCanvas: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor debe usarse dentro de <EditorProvider>");
  return ctx;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [zoom, setZoomState] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [, forceRerender] = useReducer((c: number) => c + 1, 0);

  const snapEnabledRef = useRef(snapEnabled);
  const panModeRef = useRef(panMode);
  const gridSizeRef = useRef(20);
  const isProgrammaticRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    snapEnabledRef.current = snapEnabled;
  }, [snapEnabled]);
  useEffect(() => {
    panModeRef.current = panMode;
  }, [panMode]);

  const pushHistory = useCallback((targetCanvas: Canvas) => {
    if (isProgrammaticRef.current) return;
    const json = JSON.stringify(targetCanvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    forceRerender();
  }, []);

  const restoreSnapshot = useCallback(
    async (targetCanvas: Canvas, json: string) => {
      isProgrammaticRef.current = true;
      await targetCanvas.loadFromJSON(JSON.parse(json));
      targetCanvas.requestRenderAll();
      isProgrammaticRef.current = false;
      setSelectedObject(null);
      forceRerender();
    },
    [],
  );

  useEffect(() => {
    if (!canvasElRef.current) return;

    const fabricCanvas = new Canvas(canvasElRef.current, {
      width: ARTBOARD_SIZE,
      height: ARTBOARD_SIZE,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    fabricCanvas.on("object:modified", () => pushHistory(fabricCanvas));
    fabricCanvas.on("object:added", () => pushHistory(fabricCanvas));
    fabricCanvas.on("object:removed", () => pushHistory(fabricCanvas));

    fabricCanvas.on("selection:created", () => setSelectedObject(fabricCanvas.getActiveObject() ?? null));
    fabricCanvas.on("selection:updated", () => setSelectedObject(fabricCanvas.getActiveObject() ?? null));
    fabricCanvas.on("selection:cleared", () => setSelectedObject(null));

    fabricCanvas.on("object:moving", (e) => {
      if (!snapEnabledRef.current || !e.target) return;
      const grid = gridSizeRef.current;
      e.target.set({
        left: Math.round((e.target.left ?? 0) / grid) * grid,
        top: Math.round((e.target.top ?? 0) / grid) * grid,
      });
    });

    let isPanning = false;
    let lastX = 0;
    let lastY = 0;
    fabricCanvas.on("mouse:down", (opt) => {
      if (!panModeRef.current) return;
      isPanning = true;
      fabricCanvas.selection = false;
      const evt = opt.e as MouseEvent;
      lastX = evt.clientX;
      lastY = evt.clientY;
    });
    fabricCanvas.on("mouse:move", (opt) => {
      if (!isPanning) return;
      const evt = opt.e as MouseEvent;
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return;
      vpt[4] += evt.clientX - lastX;
      vpt[5] += evt.clientY - lastY;
      fabricCanvas.requestRenderAll();
      lastX = evt.clientX;
      lastY = evt.clientY;
    });
    fabricCanvas.on("mouse:up", () => {
      isPanning = false;
      fabricCanvas.selection = !panModeRef.current;
    });

    historyRef.current = [JSON.stringify(fabricCanvas.toJSON())];
    historyIndexRef.current = 0;

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
      setCanvas(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addShape = useCallback(
    (shapeId: ShapeId) => {
      if (!canvas) return;
      const definition = SHAPE_LIBRARY.find((s) => s.id === shapeId);
      if (!definition) return;
      const obj = definition.create();
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    },
    [canvas],
  );

  const addPreset = useCallback(
    (preset: PresetDefinition) => {
      if (!canvas) return;
      const group = createPresetGroup(preset);
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
    },
    [canvas],
  );

  const addText = useCallback(() => {
    if (!canvas) return;
    const text = new Textbox("Tu texto", {
      left: 60,
      top: 60,
      width: 160,
      fontSize: 22,
      fontFamily: "system-ui, sans-serif",
      fill: "#1a1a1a",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  }, [canvas]);

  const addImageFromFile = useCallback(
    async (file: File) => {
      if (!canvas) return;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = await FabricImage.fromURL(dataUrl);
      const maxSize = ARTBOARD_SIZE * 0.6;
      if (img.width && img.width > maxSize) {
        const scale = maxSize / img.width;
        img.scale(scale);
      }
      img.set({ left: 80, top: 80 });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    },
    [canvas],
  );

  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [canvas]);

  const updateSelected = useCallback(
    (props: Record<string, unknown>) => {
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (!active) return;
      active.set(props);
      canvas.requestRenderAll();
      pushHistory(canvas);
      forceRerender();
    },
    [canvas, pushHistory],
  );

  const undo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    void restoreSnapshot(canvas, historyRef.current[historyIndexRef.current]);
  }, [canvas, restoreSnapshot]);

  const redo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    void restoreSnapshot(canvas, historyRef.current[historyIndexRef.current]);
  }, [canvas, restoreSnapshot]);

  const setZoom = useCallback(
    (value: number) => {
      if (!canvas) return;
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
      canvas.setZoom(clamped);
      canvas.requestRenderAll();
      setZoomState(clamped);
    },
    [canvas],
  );

  const zoomIn = useCallback(() => setZoom(zoom + 0.1), [setZoom, zoom]);
  const zoomOut = useCallback(() => setZoom(zoom - 0.1), [setZoom, zoom]);
  const resetZoom = useCallback(() => {
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomState(1);
    canvas.requestRenderAll();
  }, [canvas]);

  const toggleSnap = useCallback(() => setSnapEnabled((v) => !v), []);
  const togglePanMode = useCallback(() => setPanMode((v) => !v), []);

  const exportPNG = useCallback(
    (multiplier = 2) => {
      if (!canvas) throw new Error("Canvas no inicializado");
      return canvas.toDataURL({ format: "png", multiplier });
    },
    [canvas],
  );

  const exportSVG = useCallback(() => {
    if (!canvas) throw new Error("Canvas no inicializado");
    return canvas.toSVG();
  }, [canvas]);

  const exportPDF = useCallback(() => {
    if (!canvas) return;
    const dataUrl = exportPNG(3);
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const pdf = new jsPDF({ unit: "px", format: [width, height] });
    pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
    pdf.save("cucarda.pdf");
  }, [canvas, exportPNG]);

  const getCanvasJson = useCallback((): Record<string, unknown> => {
    if (!canvas) return {};
    return canvas.toJSON();
  }, [canvas]);

  const loadDesign = useCallback(
    async (json: Record<string, unknown>) => {
      if (!canvas) return;
      isProgrammaticRef.current = true;
      await canvas.loadFromJSON(json);
      canvas.requestRenderAll();
      isProgrammaticRef.current = false;
      historyRef.current = [JSON.stringify(canvas.toJSON())];
      historyIndexRef.current = 0;
      setSelectedObject(null);
      forceRerender();
    },
    [canvas],
  );

  const resetCanvas = useCallback(() => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.requestRenderAll();
    historyRef.current = [JSON.stringify(canvas.toJSON())];
    historyIndexRef.current = 0;
    setSelectedObject(null);
    forceRerender();
  }, [canvas]);

  const value: EditorContextValue = {
    canvas,
    canvasElRef,
    selectedObject,
    zoom,
    snapEnabled,
    panMode,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
    addShape,
    addPreset,
    addText,
    addImageFromFile,
    deleteSelected,
    updateSelected,
    undo,
    redo,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleSnap,
    togglePanMode,
    exportPNG,
    exportSVG,
    exportPDF,
    getCanvasJson,
    loadDesign,
    resetCanvas,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
