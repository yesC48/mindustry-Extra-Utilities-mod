/*
* @author <guiY>
* @readme <bulletTypes>
*/

const items = require("game/items");

exports.artillerySurge = new ArtilleryBulletType(2.8, 20, "shell");
Object.assign(exports.artillerySurge, {
    hitEffect : Fx.blastExplosion,
    knockback : 0.8,
    lifetime : 100,
    width : 14,
    height : 14,
    collidesTiles : false,
    ammoMultiplier : 3,
    splashDamageRadius : 30 * 0.75,
    splashDamage : 38,
    frontColor : Pal.surge,
    lightningDamage : 12,
    lightning : 2,
    lightningLength : 8,
});

const shieldBullet = (() => {
    return (object) => {
        const options = Object.assign({
            lifetime : 60,
            splashDamageRadius : 80,
            shootEffect : Fx.none,
            hitEffect : Fx.none,
            smokeEffect : Fx.none,
            trailEffect : Fx.none,
            despawnEffect : Fx.none,
            damage : 0,
            speed : 0,
            collides : false,
            collidesAir : false,
            collidesGround : false,
            absorbable : false,
            hittable : false,
            keepVelocity : false,
            reflectable : false,
        }, object);
        const eff1 = new Effect(35, cons(e => {
            Draw.color(items.lightninAlloy.color);
                Lines.stroke(e.fout() * 4); 
                Lines.poly(e.x, e.y, 6, options.splashDamageRadius * 0.525 + 75 * e.fin());
}));
        const shieldDefense = new Effect(20, cons(e => {
                Draw.color(items.lightninAlloy.color);
                Lines.stroke(e.fslope() * 2.5);
                Lines.poly(e.x, e.y, 6, 3 * e.fout() + 9);
                const d = new Floatc2({get(x, y){
                    Lines.poly(e.x + x, e.y + y, 6, 2 * e.fout() + 2);
                }})
                Angles.randLenVectors(e.id, 2, 32 * e.fin(), 0, 360,d);
}));
        const shield = new JavaAdapter(BasicBulletType, {
            update(b){
                const realRange = this.splashDamageRadius * b.fout();
                Groups.bullet.intersect(b.x - realRange, b.y - realRange, realRange * 2, realRange * 2, cons(trait =>{
                    if(trait.type.absorbable && trait.team != b.team && Intersector.isInsideHexagon(trait.getX(), trait.getY(), realRange, b.x, b.y) ){
                        trait.absorb();
                        shieldDefense.at(trait);
                    }
                }));
            },
            init(b){
                if(b == null) return;
                eff1.at(b.x, b.y, b.fout(), items.lightninAlloy.color);
            },
            draw(b){
                Draw.color(items.lightninAlloy.color);
                var fout = Math.min(b.fout(), 0.5) *2;
                Lines.stroke(fout * 3);
                Lines.poly(b.x, b.y, 6, (this.splashDamageRadius * 0.525) * fout * fout);
                Draw.alpha(fout * fout * 0.15);
                Fill.poly(b.x, b.y, 6, (this.splashDamageRadius * 0.525) * fout * fout);
            },
        });
        shield.lifetime = options.lifetime;
        shield.splashDamageRadius = options.splashDamageRadius;
        shield.shootEffect = options.shootEffect;
        shield.hitEffect = options.hitEffect;
        shield.smokeEffect = options.smokeEffect;
        shield.trailEffect = options.trailEffect;
        shield.despawnEffect = options.despawnEffect;
        shield.damage = options.damage;
        shield.speed = options.speed;
        shield.collides = options.collides;
        shield.collidesAir = options.collidesAir;
        shield.collidesGround = options.collidesGround;
        shield.absorbable = options.absorbable;
        shield.hittable = options.hittable;
        shield.keepVelocity = options.keepVelocity;
        shield.reflectable = options.reflectable;
        return shield;
    }
})();
exports.shieldBullet = shieldBullet;

function flameShoot(colorBegin, colorTo, colorEnd, length, cone, number, lifetime){
    return new Effect(lifetime, 80, cons(e => {
        Draw.color(colorBegin, colorTo, colorEnd, e.fin());
        Angles.randLenVectors(e.id, number, e.finpow() * length, e.rotation, cone, (x, y) => {
            Fill.circle(e.x + x, e.y + y, 0.65 + e.fout() * 1.5);
        });
    }));
}
//flameBullet
const flame = (() => {
    return (object) => {
        const options = Object.assign({
            //not in bullet
            flameLength : 88,//real flame range
            flameCone : 10,
            particleNumber : 72,
            //flameColors▼
            colorBegin : Pal.lightFlame,
            colorTo : Pal.darkFlame,
            colorEnd : Color.gray,
            //in bullet
            ammoMultiplier : 3,
            lifetime : 22,
            hitEffect : Fx.none,
            smokeEffect : Fx.none,
            trailEffect : Fx.none,
            despawnEffect : Fx.none,
            damage : 20,
            speed : 0,
            pierce : true,
            collidesAir : false,
            absorbable : false,
            hittable : false,
            keepVelocity : false,
            status : StatusEffects.burning,
            statusDuration : 60 * 4,
            buildingDamageMultiplier : 0.4,
        }, object);
        options.shootEffect = flameShoot(options.colorBegin, options.colorTo, options.colorEnd, options.flameLength/0.75, options.flameCone, options.particleNumber, options.lifetime + 10);
        //Define a bullet▼
        const f = extend(BulletType, {
            //draw hitsize
            hit(b){
                if(this.absorbable && b.absorbed) return;
                //let's step by step
                //unit▼
                Units.nearbyEnemies(b.team, b.x, b.y, options.flameLength, cons(unit =>{
                    if(Angles.within(b.rotation(), b.angleTo(unit), options.flameCone) && unit.checkTarget(this.collidesAir, this.collidesGround)){
                        Fx.hitFlameSmall.at(unit);
                        unit.damage(this.damage * this.ammoMultiplier);
                        unit.apply(this.status, this.statusDuration);
                    }
                }));
                //block▼
                Vars.indexer.allBuildings(b.x, b.y, options.flameLength, cons(other => {
                    if(other.team != b.team && Angles.within(b.rotation(), b.angleTo(other), options.flameCone)){
                        Fx.hitFlameSmall.at(other);
                        other.damage(this.damage * options.buildingDamageMultiplier * this.ammoMultiplier);
                    }
                }));
            },
        });
        f.ammoMultiplier = options.ammoMultiplier;
        f.lifetime = options.lifetime;
        f.shootEffect = options.shootEffect;
        f.hitEffect = options.hitEffect;
        f.smokeEffect = options.smokeEffect;
        f.trailEffect = options.trailEffect;
        f.despawnEffect = options.despawnEffect;
        f.damage = options.damage;
        f.speed = options.speed;
        f.pierce = options.pierce;
        f.collidesAir = options.collidesAir;
        f.absorbable = options.absorbable;
        f.hittable = options.hittable;
        f.keepVelocity = options.keepVelocity;
        f.status = options.status;
        f.statusDuration = options.statusDuration;
        f.despawnHit = true;
        return f;
    }
})();
exports.flame = flame;