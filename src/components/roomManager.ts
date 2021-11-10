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
let extensions: StructureExtension[] = [];
let notRoadNeedingRepair: Structure[] = [];

/**
 * The Main Function in every Room witch is executed
 * @export run
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
    extensions = _.filter(structures, (structure) => structure.structureType === STRUCTURE_EXTENSION) as StructureExtension[];
    notRoadNeedingRepair = _.filter(structures, (structure) => {
        if (structure.structureType !== STRUCTURE_ROAD){
            if (structure.structureType === STRUCTURE_WALL) {
                const hitsToRepair = rm.desiredWallHitPoints - structure.hits;
                //if (hitsToRepair > rm.desiredWallHitPoints * 0.25)
                if (hitsToRepair > 0) {
                    log.debug("Wall>0" + hitsToRepair + "|" + structure.structureType )
                    return true
                }
            } else if (structure.structureType === STRUCTURE_RAMPART) {
                const hitsToRepair = rm.desiredWallHitPoints - structure.hits;
                if (hitsToRepair > rm.desiredWallHitPoints * 0.25) {
                    log.debug("Ramp>0" + hitsToRepair + "|" + structure.structureType )
                    return true;
                }
            } else {
                const hitsToRepair = structure.hitsMax - structure.hits;
                if (hitsToRepair > structure.hitsMax * 0.25) {
                    log.debug("Else>0" + hitsToRepair + "|" + structure.structureType )
                    return true;
                }
            }
        }
        return false;
    }) as Structure[];
    // constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    constructionSites = _.sortBy(constructionSites, (constructionSite: ConstructionSite) => constructionSite.id);
    notRoadNeedingRepair = _.sortBy(notRoadNeedingRepair, (struct: Structure) => struct.id);

    let numTowersToBuild = 0;
    let numExtensionToBuild = 0;
    if (room.controller != null){
        switch (room.controller.level){
            case 2: numTowersToBuild = 0; numExtensionToBuild = 5; break;
            case 3: numTowersToBuild = 1; numExtensionToBuild = 10; break;
            case 4: numTowersToBuild = 1; numExtensionToBuild = 20; break;
            case 5: numTowersToBuild = 2; numExtensionToBuild = 30; break;
            case 6: numTowersToBuild = 2; numExtensionToBuild = 40; break;
            case 7: numTowersToBuild = 3; numExtensionToBuild = 50; break;
            case 8: numTowersToBuild = 8; numExtensionToBuild = 60; break;
        }
    }
    rm.techLevel = RLib.getTechLevel(room, rm, numExtensionToBuild);
    rm.energyLevel = RLib.getRoomEnergyLevel(rm, room);
    rm.buildsThisTick = 0;

    if(Game.time % 10 === 0){
        RLib.buildExtension(rm, room, numExtensionToBuild);
    }
    if (Game.time % 50 === 0){
        rm.extensionIdsAssigned = [];
    }

    log.info(`[${Inscribe.color(`TL=${rm.techLevel} | Mem=${M.gm().memVersion}/${M.MemoryVersion} | M=${miners.length}/${rm.minerTasks.length} | B=${builders.length}/${rm.desiredBuilders} | S=${structures.length} | Con=${containers.length}/${rm.containerPositions.length} | Ext=${extensions.length}/${numExtensionToBuild} | Rep=${notRoadNeedingRepair.length} | E=${rm.extensionIdsAssigned.length}`, "skyblue")}]`);
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

        switch (rm.energyLevel) {
            case 1: bodyParts = [WORK, WORK, CARRY, MOVE]; break; // 300
            case 2: bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE]; break; // 550
            default:
            case 3: bodyParts = [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE]; break; // 6x100,3x50=750
        }
        RLib.tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_MINER, rm);
    }
    if (rm.techLevel >= 3){
        if(builders.length < rm.desiredBuilders){
            // bodyParts = [WORK, WORK, CARRY, MOVE];
            switch (rm.energyLevel) {
                case 1: bodyParts = [WORK, CARRY, CARRY, MOVE]; break; // 250
                case 2: bodyParts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE]; break; // 550;
                default:
                case 3: bodyParts = [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; break; // 750;
            }
            RLib.tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_BUILDER, rm);
        }
    }
}
Profiler.registerFN(buildMissingCreeps, '_buildMissingCreeps');



