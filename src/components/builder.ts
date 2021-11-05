import {log} from '../tools/logger/logger';
import * as M from "../memory";

/**
 * Main Builder function to execute
 * @param room The Room in which the Builder works
 * @param creep The Creep which is the Builder
 * @param rm The RoomMemory of the given Room
 */
export function run(room: Room, creep: Creep, rm: M.RoomMemory): void {
    const cm = M.cm(creep);
    room.name;
    rm.roomName;
    cm.log;
}

/**
 * Check if there are Construction site and build them
 * @param room The Room in which the Builder works
 * @param creep The Creep which is the Builder
 * @returns True if something can be build
 */
export function buildIfCan(room: Room, creep: Creep): boolean {
    log.info(`buildIfCan ${room.name}, ${creep.name}`);

    const targets = room.find(FIND_CONSTRUCTION_SITES) as ConstructionSite[];
    if (targets.length > 0) {
        const status = creep.build(targets[0]);
        if (status === ERR_NOT_IN_RANGE) {
            const moveCode = creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
            if (moveCode !== OK && moveCode !== ERR_TIRED) {
                log.error(`move and got ${moveCode}`);
            }
        }
        return true;
    } else {
        return false;
    }
}
