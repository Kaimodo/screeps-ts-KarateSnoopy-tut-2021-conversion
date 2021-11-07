import * as Config from "config";
import * as miner from "./miner";
import * as builder from "./builder";
import { log } from "../tools/logger/logger";
import * as Profiler from "screeps-profiler";
import * as M from "memory";
import * as Inscribe from "screeps-inscribe";
import {ENABLE_DEBUG_MODE} from "config";
import * as RLib from "./lib/lib";

let creeps: Creep[];
let creepCount: number = 0;
let miners: Creep[] = [];
let builders: Creep[] = [];
let structures: Structure[] = [];
let containers: StructureContainer[] = [];
let constructionSites: ConstructionSite[] = [];

/**
 * The Main Function in every Room witch is executed
 * @param room The Room in which run is started
 * @param rm The Memory for the Room
 */
export function run(room: Room, rm: M.RoomMemory): void
{

    if(Game.time % 1 === 0){
        _scanRoom(room, rm);
    }

    if(rm.spawnText !== undefined && rm.spawnTextId !== undefined){
        const spawnId: Id<StructureSpawn> = rm.spawnTextId as Id<StructureSpawn>;
        const spawn = Game.getObjectById(spawnId) as StructureSpawn;

        room.visual.text(
            rm.spawnText,
            spawn.pos.x + 1,
            spawn.pos.y,
            { align: "left", opacity: 0.8 }
        );
        if (spawn.spawning === null){
            rm.spawnText = undefined;
        }
    }

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
            creepMem.name = creep.name;
            if(creep.name.search("ROLE_MINER") >= 0){
                creepMem.role = M.CreepRoles.ROLE_MINER;
            } else if (creepMem.name.search("ROLE_BUILDER") >= 0){
                creepMem.role = M.CreepRoles.ROLE_BUILDER;
            }
        }
    });
}
Profiler.registerFN(run, 'run(Creep)');

/**
 * Count Creeps and their roles
 * @param room The Room in which run is started
 * @param rm The Memory of the Room
 */
 function _scanRoom(room: Room, rm: M.RoomMemory)
 {
     creeps = room.find(FIND_MY_CREEPS);
     creepCount = _.size(creeps);
     miners = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_MINER);
     builders = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_BUILDER);
     structures = room.find<StructureContainer>(FIND_STRUCTURES);
     containers = _.filter(structures, (structure) => structure.structureType === STRUCTURE_CONTAINER) as StructureContainer[];
     constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
     rm.techLevel = RLib.getTechLevel(room, rm);
     rm.buildsThisTick = 0;

     log.info(`[${Inscribe.color(`TL=${rm.techLevel} | Mem: ${M.gm().memVersion}/${M.MemoryVersion} | M: ${miners.length}/${rm.minerTasks.length} | B: ${builders.length}/${rm.desiredBuilders} | S: ${structures.length} | Con: ${containers.length}/${rm.containerPositions.length}`, "skyblue")}]`);
 }
 Profiler.registerFN(_scanRoom, '_scanRoom');


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

        RLib.tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_MINER, rm);
    }
    if (rm.techLevel >= 3){
        if(builders.length < rm.desiredBuilders){
            bodyParts = [WORK, WORK, CARRY, MOVE];
            RLib.tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_BUILDER, rm);
        }
    }
}
Profiler.registerFN(buildMissingCreeps, '_buildMissingCreeps');



