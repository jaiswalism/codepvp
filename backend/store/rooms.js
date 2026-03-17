export const rooms = {}; // Stores 'waiting' and 'in-progress' rooms
export const userToRoom = {}; // Maps user to roomId
export const activeTimers = new Map();
export const queue = [];
export const frontendQueue = [];
export const frontendRooms = {};