# Drift Loop (working title) - Unity 3D racing game

A 3D driving/racing game for iOS/Android built with Unity. Single-player time
trial on a procedurally-built oval track: 3 laps, best-lap timer, on-screen
touch controls.

## Read this first: how this folder is different from a normal Unity project

There's no Unity Editor available in the environment that generated this
code, so I couldn't create/validate an actual `.unity` scene file or the
usual `ProjectSettings`/`Packages` folders by hand - getting Unity's
serialized-scene format wrong by even one field can produce a project that
won't open. Instead, everything the game needs is in `Assets/Scripts/`, and
**`GameBootstrap.cs` builds the entire game at runtime from code**: track,
car, camera, lighting, HUD, and touch controls. You attach it to one empty
GameObject in any Unity project and press Play.

This also means the code has been written carefully against the standard
Unity APIs but has **not been compiled or run** - there was nothing here to
run it on. The first thing to do locally is open the project and check the
Console for compile errors, then tell me what you see so I can fix it fast.

## First thing to check if nothing responds to input

**Edit > Project Settings > Player > Other Settings > Active Input
Handling** must be set to **"Both"** or **"Input Manager (Old)"**. This
project uses the classic `Input` class and legacy UI, not the new Input
System package. Most Unity templates default to "Both", but if yours is set
to "Input System Package (New)" only, driving and the on-screen buttons
won't work until you change this (and restart the Editor).

## Setup

1. Install **Unity Hub**, then install a recent Unity 6 LTS editor through it
   (any 6000.x release should work - nothing here depends on scene-file
   internals that change between patch versions).
2. In Unity Hub, create a new project using the **3D (Built-In Render
   Pipeline)** template.
3. Copy this repo's `unity/Assets/Scripts/` folder into your new project's
   `Assets/Scripts/` folder (Unity will auto-generate `.meta` files for the
   scripts on next focus).
4. Check the Console for compile errors - if you see any, share them with me.
5. In the default scene, create an empty GameObject (`GameObject > Create
   Empty`), rename it `GameBootstrap`, and add the `Game Bootstrap`
   component to it.
6. Press **Play**. You should see an oval track, a blue placeholder car, a
   3-2-1 countdown, then a drivable car with a speed/lap/timer HUD.

### Controls

- **Editor (keyboard)**: W/↑ throttle, S/↓ brake, A/D or ←/→ steer.
- **Device (touch)**: on-screen ◀ / ▶ / BRK / GAS buttons in the corners.

## Building to a phone

1. In Unity Hub, install the **Android Build Support** and/or **iOS Build
   Support** modules for your Unity version if you haven't already.
2. `File > Build Settings`, switch platform to Android or iOS.
3. `Edit > Project Settings > Player`: set a bundle identifier (e.g.
   `com.yourname.driftloop`), and consider setting orientation to Landscape
   for a racing game.
4. `Build` (or `Build And Run` with a device connected).

## What's here vs. what's placeholder

- **Track** (`TrackBuilder.cs`): a procedurally generated stadium-shaped
  oval built from primitive cubes (road tiles + side walls), with checkpoint
  triggers spaced around it so lap order is enforced and shortcuts are
  blocked. No real road/environment art.
- **Car** (`GameBootstrap.BuildCar`, `CarController.cs`): a scaled cube body
  on four `WheelCollider`s with cylinder wheel visuals - no 3D car model.
  Suspension/motor/steering values are a reasonable starting point, not a
  tuned feel; adjust them once you can playtest.
- **Race logic** (`RaceManager.cs`): countdown, lap counting, best-lap
  timer, and a fallback respawn if the car falls off the track.
- **HUD & input** (`HUDController.cs`, `DriveInput.cs`): built entirely from
  code using Unity's legacy UI system, no prebuilt UI assets.

## Honest scope note

This is single-player only - no co-op/multiplayer this time (unlike the
earlier React Native prototype in this repo's history, which had a co-op
mode). Natural next steps: real 3D car and environment art (Asset Store or
custom), AI opponents, a proper mobile-friendly virtual joystick (Unity's
new Input System), sound effects and tire-smoke particles, a leaderboard,
and eventually multiplayer racing via Netcode for GameObjects or a service
like Photon, if you want it.
