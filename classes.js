class Sprite {
    constructor({
        position,
        velocity,
        image,
        frames = { max: 1, hold: 10 },
        sprites,
        animate = false,
        rotation = 0,
        scale = 1
    }){ 
        this.position = position;
        this.image = new Image();
        this.frames = { ...frames, val: 0, elapsed: 0 }
        this.image.onload = () => {
          this.width = (this.image.width / this.frames.max) * scale
          this.height = this.image.height * scale
        }
        this.image.src = image.src
        this.animate = animate
        this.sprites = sprites
        this.opacity = 1
        this.rotation = rotation
        this.scale = scale
    }
    draw() {
        ctx.save()
        ctx.translate(
          this.position.x + this.width / 2,
          this.position.y + this.height / 2
        )
        ctx.rotate(this.rotation)
        ctx.translate(
          -this.position.x - this.width / 2,
          -this.position.y - this.height / 2
        )
        ctx.globalAlpha = this.opacity
    
        const crop = {
          position: {
            x: this.frames.val * (this.width / this.scale),
            y: 0
          },
          width: this.image.width / this.frames.max,
          height: this.image.height
        }
    
        const image = {
          position: {
            x: this.position.x,
            y: this.position.y
          },
          width: this.image.width / this.frames.max,
          height: this.image.height
        }
    
        ctx.drawImage(
          this.image,
          crop.position.x,
          crop.position.y,
          crop.width,
          crop.height,
          image.position.x,
          image.position.y,
          image.width * this.scale,
          image.height * this.scale
        )
    
        ctx.restore()
    
        if (!this.animate) return
    
        if (this.frames.max > 1) {
          this.frames.elapsed++
        }
    
        if (this.frames.elapsed % this.frames.hold === 0) {
          if (this.frames.val < this.frames.max - 1) this.frames.val++
          else this.frames.val = 0
        }
    }
}

class Character extends Sprite {
    constructor({
      position,
      velocity,
      image,
      frames = { max: 1, hold: 10 },
      sprites,
      animate = false,
      rotation = 0,
      isEnemy = false,
      name,
      attacks,
      scale
    }) {
      super({
        position,
        velocity,
        image,
        frames,
        sprites,
        animate,
        rotation,
        scale
      })
      this.health = 100
      this.isEnemy = isEnemy
      this.name = name
      this.attacks = attacks
    }
  
    faint() {
      document.querySelector("#dialogueBox").innerHTML = this.name + " fainted!"
      gsap.to(this.position, {
        y: this.position.y + 20
      })
      gsap.to(this, {
        opacity: 0
      })
      audio.battle.stop()
      audio.victory.play()
    }
  
    attack({ attack, recipient, renderedSprites }) {
      let healthBar = "#enemy-health";
      if (this.isEnemy) healthBar = "#player-health"
  
      let rotation = 1
      if (this.isEnemy) rotation = -2.2
  
      recipient.health -= attack.damage
  
      switch (attack.name) {
        case "Fireball":
          audio.initFireball.play()
          const fireballImage = new Image()
          fireballImage.src = "./img/fireball.png"
          const fireball = new Sprite({
            position: {
              x: this.position.x,
              y: this.position.y
            },
            image: fireballImage,
            frames: {
              max: 4,
              hold: 10
            },
            animate: true,
            rotation
          })
          renderedSprites.splice(1, 0, fireball)
  
          gsap.to(fireball.position, {
            x: recipient.position.x,
            y: recipient.position.y,
            onComplete: () => {
              // Enemy actually gets hit
              audio.fireballHit.play()
              gsap.to(healthBar, {
                width: recipient.health + "%"
              })
  
              gsap.to(recipient.position, {
                x: recipient.position.x + 10,
                yoyo: true,
                repeat: 5,
                duration: 0.08
              })
  
              gsap.to(recipient, {
                opacity: 0,
                repeat: 5,
                yoyo: true,
                duration: 0.08
              })
              renderedSprites.splice(1, 1)
            }
          })
  
          break
        case "Tackle":
          const tl = gsap.timeline()
  
          let movementDistance = 20
          if (this.isEnemy) movementDistance = -20
  
          tl.to(this.position, {
            x: this.position.x - movementDistance
          })
            .to(this.position, {
              x: this.position.x + movementDistance * 2,
              duration: 0.1,
              onComplete: () => {
                // 敵人被打
                audio.tackleHit.play()
                gsap.to(healthBar, {
                  width: recipient.health + "%"
                })
  
                gsap.to(recipient.position, {
                  x: recipient.position.x + 10,
                  yoyo: true,
                  repeat: 5,
                  duration: 0.08
                })
  
                gsap.to(recipient, {
                  opacity: 0,
                  repeat: 5,
                  yoyo: true,
                  duration: 0.08
                })
              }
            })
            .to(this.position, {
              x: this.position.x
            })
          break
      }
    }
  }