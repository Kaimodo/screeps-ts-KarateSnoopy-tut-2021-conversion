
# KarateSnoopy's Tutorial Conversion to 2021 (attempt)

![](https://screeps.com/images/logotype-animated.svg)

# What me added

Screeps-Inscribe from ([resir014](https://github.com/resir014/screeps-inscribe))

Logger from ([resir014](https://github.com/resir014/Stonehenge))

## Console Commands

  Commands are defined in Consolecommands.ts
  Test if they work by typing in
  ```bash
  cc.test()
  ```
  in the Console.

# This is all WIP and there will be no guarantee that commited code is working ;)
I own Screeps since 2017 but never rly digged into it. And as i Am not rly a Programmer it is
hard for me to get into the Game. I found this great Tutorial:
- ([KarateSnoopy](https://github.com/KarateSnoopy/LetsPlayScreeps))
and this will be my attempt to understand and convert it to Screeps 2021.
This will be much try and error, so i am not capable to do a video tut as he did. (mabe in the future i will)
U can get the Code for his Episodes here:
- (https://github.com/KarateSnoopy/LetsPlayScreeps/commits/master)
and the Vidoe Tutorial is on Youtube here:
- ([Youtube-Video-List](https://www.youtube.com/watch?v=ldu_AI7t_5o&list=PLCRhjmqETCePxmtB2mKScrJB_SCAI6jqw&index=3))
My Code will start on EP3 and i will try to Commit the Episodes like he did.

Here you will get the Commits from me:
([Commits](https://github.com/Kaimodo/screeps-ts-KarateSnoopy-tut-2021-conversion/commits/main))
I had some trouble in the beginning. So take the Last EP 3 Commit. sry 4 that.

### Actual Progress:
- EP3 -> done
- EP4 -> WIP

## Helper
+-------------------------------------------------------------------------------------+
|R |  R       |  C |  S |  E  | R          | W  | T |  S |  L |  E |  L |  T |  O |  P|
|C |  o       |  o |  p |  x  | a          | a  | o |  t |  i |  x |  a |  e |  b |  S|
|L |  a       |  n |  a |  t  | m          | l  | w |  o |  n |  t |  b |  t |  s |  p|
|  |  d	      |  t |  w |  e  | p          | l  | e |  r |  k |  r |  o |  m |  e |  a|
|  |          |  a |  n |  n  | a          | s  | r |  a |    |  a |  r |  i |  r |  w|
|  |          |  i |	  |  s  | r			     |    |   |  g |    |  k |	y |  n |  v |  n|
|-------------------------------------------------------------------------------------+
|0	|  0			 |  5	|  1 |  0	 |  0			   | 0	|  0|	 0 |  0	|  0 |  0	|  0 |  0	|  0|
|1	|  200		 |  5	|  1 |  0	 |  0			   | 0	|  0|	 0 |  0	|  0 |  0	|  0 |  0	|  0|
|2	|  45			 |  5	|  1 |  5	 |  300000	 | 1	|  0|	 0 |  0	|  0 |  0	|  0 |  0	|  0|
|3	|  135		 |  5	|  1 |  10 |	1000000	 | 1	|  1|	 0 |  0	|  0 |  0	|  0 |  0	|  0|
|4	|  405		 |  5	|  1 |  20 |	3000000	 | 1	|  1|	 1 |  0	|  0 |  0	|  0 |  0	|  0|
|5	|  1215000 |	5	|  1 |  30 |	10000000 | 1	|  2|	 1 |  2	|  0 |  0	|  0 |  0	|  0|
|6	|  3645000 |	5	|  1 |  40 |	30000000 | 1	|  2|	 1 |  3	|  1 |  3	|  1 |  0	|  0|
|7	|  10935000|  5	|  2 |  50 |	100000000| 1	|  3|	 1 |  4	|  1 |  6	|  1 |  0	|  0|
|8	|  99999999|	5	|  3 |  60 |	300000000| 1	|  6|	 1 |  6	|  1 |  10|  1 |  1	|  1|
+-------------------------------------------------------------------------------------+
*/

## Usefull Links
(https://screeps.fandom.com/wiki/Creep#Body_Parts)

(https://screepspl.us/services/creep-calculator/)

# Origin from here

# Screeps Typescript Starter

Screeps Typescript Starter is a starting point for a Screeps AI written in Typescript. It provides everything you need to start writing your AI whilst leaving `main.ts` as empty as possible.

## Basic Usage

You will need:

- [Node.JS](https://nodejs.org/en/download) (10.x || 12.x)
- A Package Manager ([Yarn](https://yarnpkg.com/en/docs/getting-started) or [npm](https://docs.npmjs.com/getting-started/installing-node))
- Rollup CLI (Optional, install via `npm install -g rollup`)

Download the latest source [here](https://github.com/screepers/screeps-typescript-starter/archive/master.zip) and extract it to a folder.

Open the folder in your terminal and run your package manager to install the required packages and TypeScript declaration files:

```bash
# npm
npm install

# yarn
yarn
```

Fire up your preferred editor with typescript installed and you are good to go!

### Rollup and code upload

Screeps Typescript Starter uses rollup to compile your typescript and upload it to a screeps server.

Move or copy `screeps.sample.json` to `screeps.json` and edit it, changing the credentials and optionally adding or removing some of the destinations.

Running `rollup -c` will compile your code and do a "dry run", preparing the code for upload but not actually pushing it. Running `rollup -c --environment DEST:main` will compile your code, and then upload it to a screeps server using the `main` config from `screeps.json`.

You can use `-cw` instead of `-c` to automatically re-run when your source code changes - for example, `rollup -cw --environment DEST:main` will automatically upload your code to the `main` configuration every time your code is changed.

Finally, there are also NPM scripts that serve as aliases for these commands in `package.json` for IDE integration. Running `npm run push-main` is equivalent to `rollup -c --environment DEST:main`, and `npm run watch-sim` is equivalent to `rollup -cw --dest sim`.

#### Important! To upload code to a private server, you must have [screepsmod-auth](https://github.com/ScreepsMods/screepsmod-auth) installed and configured!

## Typings

The type definitions for Screeps come from [typed-screeps](https://github.com/screepers/typed-screeps). If you find a problem or have a suggestion, please open an issue there.

## Documentation

We've also spent some time reworking the documentation from the ground-up, which is now generated through [Gitbooks](https://www.gitbook.com/). Includes all the essentials to get you up and running with Screeps AI development in TypeScript, as well as various other tips and tricks to further improve your development workflow.

Maintaining the docs will also become a more community-focused effort, which means you too, can take part in improving the docs for this starter kit.

To visit the docs, [click here](https://screepers.gitbook.io/screeps-typescript-starter/).

## Contributing

Issues, Pull Requests, and contribution to the docs are welcome! See our [Contributing Guidelines](CONTRIBUTING.md) for more details.
