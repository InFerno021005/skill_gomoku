/**
 * SoundManager
 * Handles audio feedback for the game.
 * In a production app, you would load actual .mp3/.wav files here.
 */
class SoundManager {
  playPlacePiece() {
    // console.log("🎵 Sound: Clack");
    // const audio = new Audio('/assets/place.mp3');
    // audio.play();
  }

  playSkillTrigger(skillName: string) {
    // console.log(`🎵 Sound: Skill ${skillName}`);
  }

  playWin() {
    // console.log("🎵 Sound: Victory Fanfare");
  }

  playCrack() {
    // console.log("🎵 Sound: Crack/Thunder");
  }
  
  playWhoosh() {
    // console.log("🎵 Sound: Whoosh");
  }
}

export const soundManager = new SoundManager();