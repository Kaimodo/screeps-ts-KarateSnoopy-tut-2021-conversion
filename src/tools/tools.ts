import * as Inscribe from "screeps-inscribe";
import * as Config from "config";


/**
 * Get some basic Info about the game state
 */
export function log_info() {
  // Periodic logging of useful info
  if (Game.time % 100 === 0) {
    // CPU: limit: 30, tickLimit: 500, bucket: 10000, used: 4.08803
    console.log(
      `[${Inscribe.color(Config.FIRST_ROOM_NAME, "skyblue")}]| Game-Tick: ${Game.time}` + "| CPU Used: " + Game.cpu.getUsed() + "| Buck: " + Game.cpu.bucket
    );
  }
}

/**
 * Clear Memory of non Existant Creep
 */
export function ClearNonExistingCreeMemory() {
  if (Game.time % 100 === 0) {
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
        console.log(`[${Inscribe.color("Clearing non-existing creep memory: " + name, "red")}]`);
      }
    }
  }
}

