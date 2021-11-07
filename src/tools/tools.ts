import * as Inscribe from "screeps-inscribe";
import * as Config from "config";
import * as M from "memory";
import * as RLib from "..//components/Lib/lib";
import { log } from "./logger/logger";
import {ENABLE_DEBUG_MODE} from "config";

/**
 * Memory Initialization
 * @export memoryInit
 */
export function memoryInit(){
  _clearMemory();

  const mem = M.gm();
  mem.creeps = {};
  mem.rooms = {};
  mem.uuid = 0;
  mem.memVersion = M.MemoryVersion;
  log.info("Initiating Game: Using MemVersion: " + mem.memVersion);
}

/**
 * clear Memory
 * @export _clearMemory
 */
export function _clearMemory(): void {
  for (const name in Memory.flags) {
    if (!(name in Game.flags)) {
      delete Memory.flags[name];
    }
  }
  for (const name in Memory.spawns) {
    if (!(name in Game.spawns)) {
      delete Memory.spawns[name];
    }
  }
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
  for (const name in Memory.rooms) {
    if (!(name in Game.rooms)) {
      delete Memory.rooms[name];
    }
  }
}

/**
 *
 * Show CPU used for parsing the Memory
 * @export CpuUsedParsing
 */
export function CpuUsedParsing(){
  let stringified = JSON.stringify(Memory);
  let startCpu = Game.cpu.getUsed();
  JSON.parse(stringified);
  log.info("CPU used on Memory parsing: ", Game.cpu.getUsed() - startCpu);
}

/**
 * Generate Pixel if Bucket >= number
 * @export generatePixel
 * @param bucketHight The Amount of minimal Bucket
 */
export function generatePixel(bucketHight: number): void {
  if (Game.cpu.bucket >= bucketHight) {
      Game.cpu.generatePixel();
  }
}

/**
 * Creates a Link to the given Room
 * @export roomLink
 * @param roomName The Room name
 * @returns Link
 */
export function roomLink(roomName: string): string {
  return `<a href="https://screeps.com/a/#!/room/${Game.shard.name}/${roomName}">${roomName}</a>`;
}

/**
 * Does the function with each Creep.
 * @export forEachCreep
 * @param func The given Function
 */
export const forEachCreep = (func: (item: Creep) => void): void => {
  Object.values(Game.creeps).forEach((creep) => func(creep));
};

/**
 * Get the average distance between Start and End point.
 * @export distance
 * @param {{ x: number; y: number }} start Start Position (x,y)
 * @param {{ x: number; y: number }} end End Position (x,y)
 * @return {*}  {number} The distance between both points as Number
 */
export function distance(start: { x: number; y: number }, end: { x: number; y: number }): number {
  return Math.max(Math.abs(start.x - end.x), Math.abs(start.y - end.y));
}

/**
 * Get some basic Info about the game state
 * @export log_info
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
 * Clear Memory of non Existent Creep
 * @export ClearNonExistingCreeMemory
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



