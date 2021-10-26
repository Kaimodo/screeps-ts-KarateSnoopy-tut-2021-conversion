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
import {SPAWNNAME} from "config";

import * as Creepmanager from "components/creepManager";

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
    // Check uuid and reset it if needed
    if (!Memory.uuid || Memory.uuid > 1000){
      Memory.uuid = 0;
    }
    // Visualize Spawn (From the Screeps-Tutorial Code)
    if(Game.spawns[SPAWNNAME].spawning) {
      // @ts-ignore: Object is possibly 'null'.
      var spawningCreep = Game.creeps[Game.spawns[SPAWNNAME].spawning.name];
      Memory.uuid++;
      Game.spawns[SPAWNNAME].room.visual.text(
          '🛠️' + spawningCreep.memory.role,
          Game.spawns[SPAWNNAME].pos.x + 1,
          Game.spawns[SPAWNNAME].pos.y,
          {align: 'left', opacity: 0.8});
    }

    // Run Creepmanager for evers owned Room.
    for (const r in Game.rooms) {
      const room: Room = Game.rooms[r];
      Creepmanager.run(room);
    }

    // Clear Memory and give short Game-Info
    Tools.ClearNonExistingCreeMemory()
    Tools.log_info()
  });
});
