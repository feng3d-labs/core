import { oav } from '@feng3d/objectview';
import { ObjectUtils } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { watch } from '@feng3d/watcher';
import { Behaviour } from '../component/Behaviour';
import { getComponentType, RegisterComponent } from '../component/Component';
import { AddComponentMenu } from '../Menu';
import { AnimationClip } from './AnimationClip';
import { PropertyClip, PropertyClipPathItemType } from './PropertyClip';

declare global
{
    interface MixinsComponentMap { Animation: Animation; }
}

@AddComponentMenu('Animator/Animation')
@RegisterComponent({ name: 'Animation' })
export class Animation extends Behaviour
{
    @oav({ component: 'OAVDefault', componentParam: { dragparam: { accepttype: 'animationclip', datatype: 'animationclip' } } })
    @serialize
    @watch('_onAnimationChanged')
    animation: AnimationClip;

    @oav({ component: 'OAVArray', componentParam: { dragparam: { accepttype: 'animationclip', datatype: 'animationclip' }, defaultItem: () => new AnimationClip() } })
    @serialize
    animations: AnimationClip[] = [];

    /**
     * 动画事件，单位为ms
     */
    @oav()
    @watch('_onTimeChanged')
    time = 0;

    @oav()
    @serialize
    isplaying = false;

    /**
     * 播放速度
     */
    @oav()
    @serialize
    playspeed = 1;

    /**
     * 动作名称
     */
    get clipName()
    {
        return this.animation ? this.animation.name : null;
    }

    get frame()
    {
        if (!this.animation) return -1;
        const cycle = this.animation.length;
        const cliptime = (this.time % cycle + cycle) % cycle;
        const _frame = Math.round(this._fps * cliptime / 1000);

        return _frame;
    }

    update(interval: number)
    {
        if (this.isplaying) this.time += interval * this.playspeed;
    }

    dispose()
    {
        this.animation = null;
        this.animations = null;
        super.dispose();
    }

    private num = 0;
    private _fps = 24;
    private _objectCache = new Map();

    private _updateAni()
    {
        if (!this.animation) return;
        if ((this.num++) % 2 !== 0) return;

        const cycle = this.animation.length;
        const cliptime = (this.time % cycle + cycle) % cycle;

        const propertyClips = this.animation.propertyClips;

        for (let i = 0; i < propertyClips.length; i++)
        {
            const propertyClip = propertyClips[i];

            const propertyValues = propertyClip.propertyValues;
            if (propertyValues.length === 0) continue;
            const propertyHost = this.getPropertyHost(propertyClip);
            if (!propertyHost) continue;
            propertyHost[propertyClip.propertyName] = propertyClip.getValue(cliptime, this._fps);
        }
    }

    private getPropertyHost(propertyClip: PropertyClip)
    {
        if (propertyClip.cacheIndex && this._objectCache[propertyClip.cacheIndex])
        { return this._objectCache[propertyClip.cacheIndex]; }

        if (!propertyClip.cacheIndex)
        { propertyClip.cacheIndex = autoobjectCacheID++; }

        let propertyHost: any = this.node3d;
        const path = propertyClip.path;

        for (let i = 0; i < path.length; i++)
        {
            const element = path[i];
            switch (element[0])
            {
                case PropertyClipPathItemType.Entity:
                    propertyHost = propertyHost.find(element[1]);
                    break;
                case PropertyClipPathItemType.Component:
                    const componentCls = getComponentType(element[1] as any);
                    propertyHost = propertyHost.getComponent(componentCls);
                    break;
                default:
                    console.error(`无法获取 PropertyHost ${element}`);
            }
            if (ObjectUtils.objectIsEmpty(propertyHost))
            { return null; }
        }
        this._objectCache[propertyClip.cacheIndex] = propertyHost;

        return propertyHost;
    }

    private _onAnimationChanged()
    {
        this.time = 0;
    }

    private _onTimeChanged()
    {
        this._updateAni();
    }
}
let autoobjectCacheID = 1;
