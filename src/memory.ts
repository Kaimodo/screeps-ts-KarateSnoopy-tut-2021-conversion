// Memory and other Things
export let MemoryVersion = 17;

/**
 * @export number Set the current Game MemoryVersion
 * @param {number} value The number
 */
export function setMemVersion(value: number): void {
    MemoryVersion = value;
}

/**
 * @export number current Game Memory Version
 * @return {*}  {number} Memory Version
 */
export function getMemVersion(): number {
    return MemoryVersion;
}

/**
 * @export enum Creep Roles as Number
 * @enum {number} Creep Roles as Number
 */
export const enum CreepRoles {
    ROLE_UNASSINGED = 0,
    ROLE_ALL,
    ROLE_BUILDER,
    ROLE_MINER,
    ROLE_MINERHAULER,
    ROLE_HEALER,
    ROLE_FIGHTER,
    ROLE_RANGER,
    ROLE_CLAIMER,
    ROLE_REMOTEMINER,
    ROLE_REMOTEHAULER,
    ROLE_CUSTOMCONTROL,
    ROLE_UPGRADER,
    ROLE_UPGRADETRANSPORT
}

/**
 *
 * @export Creep Role as String
 * @param {CreepRoles} job The Role the Creep is assigned
 * @return {*}  {string} The Role
 */
export function roleToString(job: CreepRoles): string {
    switch(job){
        case CreepRoles.ROLE_BUILDER: return 'ROLE_BUILDER';
        case CreepRoles.ROLE_MINER: return 'ROLE_MINER';
        case CreepRoles.ROLE_MINERHAULER: return 'ROLE_MINERHAULER';
        case CreepRoles.ROLE_HEALER: return 'ROLE_HEALER';
        case CreepRoles.ROLE_FIGHTER: return 'ROLE_FIGHTER';
        case CreepRoles.ROLE_RANGER: return 'ROLE_RANGER';
        case CreepRoles.ROLE_CLAIMER: return 'ROLE_CLAIMER';
        case CreepRoles.ROLE_REMOTEMINER: return 'ROLE_REMOTEMINER';
        case CreepRoles.ROLE_ALL: return 'ROLE_ALL';
        case CreepRoles.ROLE_CUSTOMCONTROL: return 'ROLE_CUSTOMCONTROL';
        case CreepRoles.ROLE_UPGRADER: return 'ROLE_UPGRADER';
        case CreepRoles.ROLE_UPGRADETRANSPORT: return 'ROLE_UPGRADETRANSPORT';
        case CreepRoles.ROLE_UNASSINGED: return 'ROLE_UNASSINGED';
        case CreepRoles.ROLE_MINERHAULER: return 'ROLE_MINERHAULER';
        default: return 'unknown Role';
    }
}

export interface MyPosition{
    x: number;
    y: number;
}

export interface PositionPlusTarget{
    x: number;
    y: number;
    targetId: string;
}

export interface RoomPositionPlusTarget{
    roomTarget: string;
    x: number;
    y: number;
    targetId: string;
}

export interface MinerTask {
    taskId: number;
    minerPosition: PositionPlusTarget;
    assignedMinerName?: string;
    sourceContainer: PositionPlusTarget | undefined;
}

export class RoomMemory {
    public roomName: string;
    public minerTasks!: MinerTask[];
    public desiredBuilders!: number;
    public energySources!: PositionPlusTarget[];
    public containerPositions!: PositionPlusTarget[];

    public constructor(room: Room){
        this.roomName = room.name;
    }
}

export interface NodeChoice
{
    x: number;
    y: number;
    dist: number;
}
export interface NodeContainerIdChoice
{
    id: string;
    count: number;
}
/**
 *
 * @export The Game Memory
 * @interface GameMemory
 */
export interface GameMemory {
    /**
     * The Game-memory Version
     * @property memVersion
     * @type {(number | undefined)}
     * @memberof GameMemory
     */
    memVersion: number | undefined;
    uuid: number;
    log: any;
    creeps: {
        [name: string]: any;
    };
    powerCreeps: {
        [name: string]: PowerCreepMemory
    };
    flags: {
        [name: string]: any;
    };
    rooms: {
        [name: string]: RoomMemory;
    };
    spawns: {
        [name: string]: any;
    }
}

export interface CreepMemory {
    role: CreepRoles;
    roleString: string;
    log: boolean;
    assignedMineTaskId?: number;
    gathering: boolean;
    assignedContainerId?: string;
}


/**
 * Returns CreepMemory as cm
 * @export CreepMemory
 * @param {Creep} creep The Creep
 * @return {*}  {CreepMemory}
 */
export function cm(creep: Creep): CreepMemory{
    return creep.memory as CreepMemory;
}

/**
 * Returns GameMemory. for better understanding its gm not only m
 * @export GameMemory
 * @return {*}  {GameMemory}
 */
export function gm(): GameMemory{
    return Memory as any as GameMemory;
}
