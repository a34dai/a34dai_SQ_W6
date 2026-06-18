# Werewolf Jailbreak

## Setup and Interaction Instructions

To run the sketch locally, open `index.html` in Google Chrome using Live Server.

**Controls:**
- Move: WASD
- Shoot: Spacebar (shoots in the direction you last moved)
- B: Skip to boss fight (testing only)
- Restart: R (after win or game over)

Explore the world, survive enemy waves as you move north, then enter the glowing boss zone to fight the giant silver beast. Avoid the blocks of silver the villagers placed! Watch the minimap to track enemies off screen.

**Adding Your Own Sounds**
1. Add your sound files to `assets/sounds/`
2. In `preload()`, uncomment the `loadSound()` lines and update the file paths
3. Uncomment the `play()` or `loop()` calls in the relevant functions — there are hooks for the boss music transition too

**Editing the Waves and Boss**
Open `data/enemies.json` to change when waves spawn, how many enemies appear, their speed, and the boss stats. Each wave has a `spawnAt` world Y value — lower values trigger later since the player starts at the bottom of the world.

**Opening the Chrome Console**
- **Windows:** Press `F12` or `Ctrl + Shift + J`, then click the **Console** tab
- **Mac:** Press `Cmd + Option + J`

## Assets

| File                                        | Source                                            |
| ------------------------------------------- | ------------------------------------------------- |
| `assets/sounds/background.mp3` [1]             | Irri, One Night Ultimate Werewolf - Disco Music (Extended) — YouTube.com |
| `assets/sounds/bossHit.mp3` [2]                  | Black_Kumizhi, Low Thumpy Kick Reverb Hit — Pixabay.com  |
| `assets/sounds/bossMusic.mp3` [3]                  | Montogoronto, Dark Fight Music Boss 2 — Pixabay.com  |
| `assets/sounds/hit.mp3` [4]                  | Homemade_SFX, Soft Body Impact — Pixabay.com  |
| `assets/sounds/hurt1.mp3` [5]                  | micahlg (Freesound), male_hurt7 — Pixabay.com  |
| `assets/sounds/hurt2.mp3` [6]                  | HighPixel (Freesound), Male Hurt Sound — Pixabay.com  |
| `assets/sounds/loseCry.mp3` [7]                  | MagiaZ, Dog cry — Pixabay.com  |
| `assets/sounds/shoot1.mp3` [8]                  | DRAGON-STUDIO, Dog Bark — Pixabay.com  |
| `assets/sounds/shoot2.mp3` [9]                  | DRAGON-STUDIO, Dog Bark Effect — Pixabay.com  |
| `assets/sounds/shoot3.mp3` [10]                  | u_5wgfa0ekjt, dog bark — Pixabay.com  |
| `assets/sounds/winHowl.mp3` [11]                  | DRAGON-STUDIO, Halloween Wolf Howling — Pixabay.com  |
| `assets/images/ground.png` [12]                    | Rob Tuytel, Brown Mud Leaves 01 — PolyHaven.com |
| `assets/images/villager.png` [13]                    | Gemerated by ChatGPT (DALL·E), OpenAI |
| `assets/images/werewolf.png` [14]                    | AntumDeluge, Werewolf (LPC) — OpenGameArt.org |

## References
[1] Irri. 2017. One Night Ultimate Werewolf - Disco Music (Extended). YouTube.com. Retrieved June 17, 2026, from https://www.youtube.com/watch?v=Gu6tjVoIHkU 

[2] Black_Kumizhi. n.d. Low Thumpy Kick Reverb Hit. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/sound-effects/technology-low-thumpy-kick-reverb-hit-494833/ 

[3] Montogoronto. n.d. Dark Fight Music Boss 2. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/music/mystery-dark-fight-music-boss-2-252590/ 

[4] Homemade_SFX. n.d. Soft Body Impact. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/sound-effects/people-soft-body-impact-295404/

[5] micahlg (Freesound). n.d. male_hurt7. Pixabay.com. Retrieved May 1, 2026, from https://pixabay.com/sound-effects/people-male-hurt7-48124/ 

[6] HighPixel. n.d. Male Hurt Sound. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/sound-effects/people-male-hurt-sound-95206/

[7] MagiaZ. n.d. Dog cry. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/sound-effects/nature-dog-cry-329759/

[8] DRAGON-STUDIO. n.d. Dog Bark. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/sound-effects/nature-dog-bark-382732/ 

[9] DRAGON-STUDIO. n.d. Dog Bark Effect. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/sound-effects/nature-dog-bark-effect-382711/

[10] u_5wgfa0ekjt. n.d. dog bark. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/sound-effects/nature-dog-bark-179915/

[11] DRAGON-STUDIO. n.d. Halloween Wolf Howling. Pixabay.com. Retrieved June 17, 2026, from https://pixabay.com/sound-effects/horror-halloween-wolf-howling-410542/

[12] Rob Tuytel. n.d. Brown Mud Leaves 01. PolyHaven.com. Retrieved June 17, 2026, from https://polyhaven.com/a/brown_mud_leaves_01

[13] OpenAI. 2026. Villager Sprite Sheet [AI-generated image]. ChatGPT (DALL·E). Generated June 17, 2026.

[14] AntumDeluge. 2019. Werewolf (LPC). OpenGameArt.org. Retrieved June 17, 2026, from https://opengameart.org/content/werewolf-lpc

