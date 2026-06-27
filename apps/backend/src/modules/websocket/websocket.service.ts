import type { Server, Socket } from "socket.io";

export function setupWebSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    const storeId = socket.handshake.auth.storeId as string | undefined;
    if (!storeId) {
      socket.disconnect();
      return;
    }

    socket.join(`store:${storeId}`);

    // Cuando un admin edita una cucarda, todos en la tienda ven el cambio al toque
    socket.on("design:updated", (designId: string) => {
      io.to(`store:${storeId}`).emit("design:changed", { designId, at: new Date() });
    });

    socket.on("design:deleted", (designId: string) => {
      io.to(`store:${storeId}`).emit("design:removed", { designId });
    });

    socket.on("disconnect", () => {
      // cleanup
    });
  });
}

export function notifyStoreDesignChanged(io: Server, storeId: string, designId: string) {
  io.to(`store:${storeId}`).emit("design:changed", { designId, at: new Date() });
}
