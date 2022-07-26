import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { AssetType } from '../assets/AssetType';
import { Feng3dObject } from '../core/Feng3dObject';
import { PropertyClip } from './PropertyClip';

export class AnimationClip extends Feng3dObject
{
    readonly assetType = AssetType.anim;

    @oav()
    @serialize
    declare name: string;
    /**
     * 动画时长，单位ms
     */
    @serialize
    length: number;

    @oav()
    @serialize
    loop = true;

    @serialize
    propertyClips: PropertyClip[];
}
