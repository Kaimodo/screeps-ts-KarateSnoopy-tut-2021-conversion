import * as Config from "config";
import * as miner from "./miner";
import { log } from "../tools/logger/logger";
import * as Profiler from "screeps-profiler";
import {SPAWNNAME} from "config";
import * as M from "memory";

export let creeps: Creep[];
export let creepCount: number = 0;
export let miners: Creep[] = [];

/**
 *
 * @param room The Room in which run is started
 */
export function run(room: Room, rm: M.RoomMemory): void
{
    rm.roomName = 'Test: 3';

    _loadCreeps(room);

    _buildMissingCreeps(room);

    _.each(creeps, (creep: Creep) =>
    {
        const creepMem = M.cm(creep);
        if (creepMem.role === M.CreepRoles.ROLE_MINER){
            miner.run(creep);
        }
    });
}
Profiler.registerFN(run, 'run(Creep)');

/**
 *
 * @param room The Room in which run is started
 */
function _loadCreeps(room: Room)
{
    creeps = room.find(FIND_MY_CREEPS);
    creepCount = _.size(creeps);
    miners = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_MINER);
}
Profiler.registerFN(_loadCreeps, '_loadCreeps');

/**
 *
 * @param room The Room in which run is started
 */
function _buildMissingCreeps(room: Room)
{
    let bodyParts: BodyPartConstant[]

    const spawns: StructureSpawn[] = room.find(FIND_MY_SPAWNS, {
        filter: (spawn: StructureSpawn) =>
        {
            return spawn.spawning === null;
        },
    });

    if (miners.length < 2)
    {
        if (miners.length < 1 || room.energyCapacityAvailable <= 800)
        {
            bodyParts = [WORK, WORK, CARRY, MOVE];
        } else if (room.energyCapacityAvailable > 800)
        {
            bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }

        _.each(spawns, (spawn: StructureSpawn) =>
        {
            _spawnCreep(spawn, bodyParts, M.CreepRoles.ROLE_MINER);
        });
    }
}
Profiler.registerFN(_buildMissingCreeps, '_buildMissingCreeps');

/**
 *
 * @param spawn The specific Spawn
 * @param bodyParts The BodyParts with which the Creep should be Spawned
 * @param role The Role of the Spawning Creep
 * @returns The Status Msg from the Spawn
 */
function _spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: M.CreepRoles)
{
    const uuid: number = Memory.uuid;
    let status: number | string = spawn.spawnCreep(bodyParts, 'status' , {dryRun: true});


    let properties: any = {
        memory: {
            log: false,
            role: role,
            roleString: M.roleToString(role)
        }
    }

    status = _.isString(status) ? OK : status;
    if (status === OK)
    {
        Memory.uuid = uuid + 1;
        let creepName: string = spawn.room.name + " - " + role + uuid;

        log.info("Started creating new creep: " + creepName);
        if (Config.ENABLE_DEBUG_MODE)
        {
            log.info("Body: " + bodyParts);
        }

        status = spawn.spawnCreep(bodyParts, creepName, properties as SpawnOptions);

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
