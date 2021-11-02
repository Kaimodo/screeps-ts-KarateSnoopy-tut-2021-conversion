import * as Config from "config";
import * as miner from "./miner";
import * as builder from "./builder";
import { log } from "../tools/logger/logger";
import * as Profiler from "screeps-profiler";
import {SPAWNNAME} from "config";
import * as M from "memory";
import * as Inscribe from "screeps-inscribe";

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
 * COunt Creeps and their roles
 * @param room The Room in which run is started
 * @param rm The Memory of the Room
 */
function loadCreeps(room: Room, rm: M.RoomMemory)
{
    creeps = room.find(FIND_MY_CREEPS);
    creepCount = _.size(creeps);
    miners = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_MINER);
    builders = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_BUILDER);
    structures = room.find<StructureContainer>(FIND_MY_STRUCTURES);
    containers = _.filter(structures, (structure) => structure.structureType === STRUCTURE_CONTAINER) as StructureContainer[];

    log.info(`[${Inscribe.color(`Mem: ${M.gm().memVersion}/${M.MemoryVersion} | M: ${miners.length}/${rm.minerTasks.length} | B: ${builders.length}/${rm.desiredBuilders}`, "skyblue")}]`);
}
Profiler.registerFN(loadCreeps, '_loadCreeps');

function tryToSpawnCreep(inactiveSpawns: StructureSpawn[], bodyParts: BodyPartConstant[], role: M.CreepRoles){
    let spawned: boolean = false;
    _.each(inactiveSpawns, (spawn: StructureSpawn) =>
    {
        if(!spawned){
            const status =spawnCreep(spawn, bodyParts, role);
            if (status === OK) {
                spawned = true;
            }
        }
    });
}

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

        tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_MINER);
    }
    if (miners.length === rm.minerTasks.length){
        if(containers.length === rm.energySources.length){
            if(builders.length < rm.desiredBuilders){
                bodyParts = [WORK, WORK, CARRY, MOVE];
                tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_BUILDER);
            }
        }
    }
}
Profiler.registerFN(buildMissingCreeps, '_buildMissingCreeps');

/**
 * Spawn the Creeps if necesary
 * @param spawn The specific Spawn
 * @param bodyParts The BodyParts with which the Creep should be Spawned
 * @param role The Role of the Spawning Creep
 * @returns The Status Msg from the Spawn
 */
function spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: M.CreepRoles): number
{
    const uuid: number = M.gm().uuid
    let status: number | string = spawn.spawnCreep(bodyParts, 'status' , {dryRun: true});


    let properties: any = {
        memory: {
            log: false,
            role: role,
            roleString: M.roleToString(role),
            gathering: true,
        }
    }

    status = _.isString(status) ? OK : status;
    if (status === OK)
    {
        M.gm().uuid = uuid + 1;
        let splitName: string = properties.memory.roleString;
        const [prefix, roleName] = splitName.split('_');

        let creepName: string = spawn.room.name + "-" + roleName + "-"+ uuid;

        log.info("Started creating new creep: " + creepName);
        if (Config.ENABLE_DEBUG_MODE)
        {
            log.info("Body: " + bodyParts);
            log.info("Memory: " + JSON.stringify(properties));
        }

        status = spawn.spawnCreep(bodyParts, creepName, properties as SpawnOptions);

        if(status === OK){
            spawn.room.visual.text(
                `🛠️ ${roleName}`,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: "left", opacity: 0.8 });
        }

        return _.isString(status) ? OK : status;
    } else
    {
        if (Config.ENABLE_DEBUG_MODE && status !== ERR_NOT_ENOUGH_ENERGY)
        {
            log.info("Failed creating new creep: " + status);
        }

        return status;
    }
}

