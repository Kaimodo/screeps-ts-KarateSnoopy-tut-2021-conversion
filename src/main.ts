const startCpu = Game.cpu.getUsed()
import { ErrorMapper } from "tools/ErrorMapper";

import * as Profiler from "screeps-profiler";
import { USE_PROFILER } from "config";

import * as Inscribe from "screeps-inscribe";

import { log } from "tools/logger/logger";
import { ENABLE_DEBUG_MODE } from "config";

import * as Tools from "tools/tools"

import { ConsoleCommands } from "tools/consolecommands";

import * as Config from "config";

import * as RoomManager from "components/roomManager";
import * as M from "memory";


//New Script loaded
console.log(`[${Inscribe.color("New Script loaded", "red")}]`);

// Check if Profiler is enabled in Config
if (USE_PROFILER) {
  log.info("Profiler an: "+ USE_PROFILER);
  Profiler.enable();
}

// Get Script loading time
const elapsedCPU = Game.cpu.getUsed() - startCpu;
console.log(`[${Inscribe.color("Script Loading needed: ", "skyblue") + elapsedCPU.toFixed(2) + " Ticks"}]`);

// main Loop + ErrorMaper + Profiler starting here
export const loop = ErrorMapper.wrapLoop(() => {
  Profiler.wrap(() => {
    global.cc = ConsoleCommands;

    // Main Loop here:
    // Check MemoryVersion and init it.
    if(M.gm().memVersion == undefined
      || M.gm().memVersion != M.MemoryVersion) {
        Tools.memoryInit();
    }
    // Check uuid and reset it if needed
    if (!M.gm().uuid || M.gm().uuid > 1000){
      M.gm().uuid = 0;
    }

    // Run RoomManager for every owned Room.
    for (const r in Game.rooms) {
      const room: Room = Game.rooms[r];
      const rm: M.RoomMemory = M.gm().rooms[room.name];

      if (rm === undefined){
        log.info('Init Room Mem for' + room.name);
        Memory.rooms[room.name] = {};
        Tools.InitRoomMemory(room, room.name);
      } else {
        RoomManager.run(room, rm);
      }
    }
    // Clear Memory and give short Game-Info
    Tools.ClearNonExistingCreeMemory()
    Tools.log_info()
  });
})
