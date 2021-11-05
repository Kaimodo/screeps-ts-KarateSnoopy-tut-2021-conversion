import * as Config from "config";
import * as miner from "./miner";
import * as builder from "./builder";
import { log } from "../tools/logger/logger";
import * as Profiler from "screeps-profiler";
import * as M from "memory";
import * as Inscribe from "screeps-inscribe";
import {ENABLE_DEBUG_MODE} from "config";
import * as RLib from "./lib/lib";

export let creeps: Creep[];
export let creepCount: number = 0;
export let miners: Creep[] = [];
export let builders: Creep[] = [];
export let structures: Structure[] = [];
export let containers: StructureContainer[] = [];

/**
 * The Main Function in every Room witch is executed
 * @param room The Room in which run is started
 * @param rm The Memory for the Room
 */
export function run(room: Room, rm: M.RoomMemory): void
{

    loadCreeps(room, rm);

    buildMissingCreeps(room, rm);

    _.each(creeps, (creep: Creep) =>
    {
        const creepMem = M.cm(creep);
        if (creepMem.role === M.CreepRoles.ROLE_MINER){
            miner.run(room, creep, rm);
        } else if (creepMem.role === M.CreepRoles.ROLE_BUILDER){
            builder.run(room, creep, rm);
        }
        else {
            creepMem.role = M.CreepRoles.ROLE_MINER;
        }
    });
}
Profiler.registerFN(run, 'run(Creep)');

/**
 * Count Creeps and their roles
 * @param room The Room in which run is started
 * @param rm The Memory of the Room
 */
 function loadCreeps(room: Room, rm: M.RoomMemory)
 {
     creeps = room.find(FIND_MY_CREEPS);
     creepCount = _.size(creeps);
     miners = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_MINER);
     builders = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_BUILDER);
     structures = room.find<StructureContainer>(FIND_STRUCTURES);
     containers = _.filter(structures, (structure) => structure.structureType === STRUCTURE_CONTAINER) as StructureContainer[];

     log.info(`[${Inscribe.color(`Mem: ${M.gm().memVersion}/${M.MemoryVersion} | M: ${miners.length}/${rm.minerTasks.length} | B: ${builders.length}/${rm.desiredBuilders} | S: ${structures.length} | Con: ${containers.length}/${rm.containerPositions.length}`, "skyblue")}]`);
 }
 Profiler.registerFN(loadCreeps, '_loadCreeps');


/**
 * Build Creeps with their Properties
 * @param room The Room in which run is started
 * @param rm The Memory of the Room
 */
function buildMissingCreeps(room: Room, rm: M.RoomMemory)
{
    let bodyParts: BodyPartConstant[]

    const inactiveSpawns: StructureSpawn[] = room.find(FIND_MY_SPAWNS, {
        filter: (spawn: StructureSpawn) =>
        {
            return spawn.spawning === null;
        },
    });

    if (miners.length < rm.minerTasks.length)
    {
        bodyParts = [WORK, WORK, CARRY, MOVE];
        // if (miners.length < 1 || room.energyCapacityAvailable <= 800)
        // {
        //     bodyParts = [WORK, WORK, CARRY, MOVE];
        // } else if (room.energyCapacityAvailable > 800)
        // {
        //     bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        // }

        RLib.tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_MINER);
    }
    if (miners.length === rm.minerTasks.length){
        if(containers.length === rm.energySources.length){
            if(builders.length < rm.desiredBuilders){
                bodyParts = [WORK, WORK, CARRY, MOVE];
                RLib.tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_BUILDER);
            }
        }
    }
}
Profiler.registerFN(buildMissingCreeps, '_buildMissingCreeps');



