import { HideFlags, RegisterComponent } from '@feng3d/ecs';
import { Matrix4x4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { RenderAtomic } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { Animation } from '../../animation/Animation';
import { Camera } from '../../cameras/Camera';
import { Renderable } from '../../core/Renderable';
import { Scene } from '../../scene/Scene';
import { SkeletonComponent } from './SkeletonComponent';

declare global
{
    interface MixinsComponentMap { SkinnedMeshRenderer: SkinnedMeshRenderer }
}

@RegisterComponent({ name: 'SkinnedMeshRenderer', single: true })
export class SkinnedMeshRenderer extends Renderable
{
    __class__: 'feng3d.SkinnedMeshRenderer';

    @serialize
    @oav()
    skinSkeleton: SkinSkeleton;

    @serialize
    initMatrix: Matrix4x4;

    /**
     * 创建一个骨骼动画类
     */
    init()
    {
        super.init();
        this.hideFlags = HideFlags.DontTransform;
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderAtomic, scene, camera);

        let frameId: string = null;
        const animation = this.getComponentsInParents(Animation)[0];
        if (animation)
        {
            frameId = `${animation.clipName}&${animation.frame}`;
        }

        renderAtomic.uniforms.u_modelMatrix = () => this.u_modelMatrix;
        renderAtomic.uniforms.u_ITModelMatrix = () => this.u_ITModelMatrix;
        //
        let skeletonGlobalMatriices = this.cacheU_skeletonGlobalMatriices[frameId];
        if (!skeletonGlobalMatriices)
        {
            skeletonGlobalMatriices = this.u_skeletonGlobalMatriices;
            if (frameId) this.cacheU_skeletonGlobalMatriices[frameId] = skeletonGlobalMatriices;
        }
        renderAtomic.uniforms.u_skeletonGlobalMatriices = skeletonGlobalMatriices;

        renderAtomic.shaderMacro.HAS_SKELETON_ANIMATION = true;
        renderAtomic.shaderMacro.NUM_SKELETONJOINT = this.skinSkeleton.joints.length;
    }

    /**
     * 销毁
     */
    dispose()
    {
        this.cacheSkeletonComponent = null;
        super.dispose();
    }

    /**
     * 缓存，通过寻找父结点获得
     */
    private cacheSkeletonComponent: SkeletonComponent;

    private cacheU_skeletonGlobalMatriices: { [id: string]: Matrix4x4[] } = {};

    private get u_modelMatrix()
    {
        if (this.cacheSkeletonComponent)
        { return this.cacheSkeletonComponent.node3d.localToWorldMatrix; }

        return this.node3d.localToWorldMatrix;
    }

    private get u_ITModelMatrix()
    {
        if (this.cacheSkeletonComponent)
        { return this.cacheSkeletonComponent.node3d.ITlocalToWorldMatrix; }

        return this.node3d.ITlocalToWorldMatrix;
    }

    private get u_skeletonGlobalMatriices()
    {
        if (!this.cacheSkeletonComponent)
        {
            let node3d = this.node3d;
            let skeletonComponent: SkeletonComponent = null;
            while (node3d && !skeletonComponent)
            {
                skeletonComponent = node3d.getComponent(SkeletonComponent);
                node3d = node3d.parent;
            }
            this.cacheSkeletonComponent = skeletonComponent;
        }
        let skeletonGlobalMatriices: Matrix4x4[] = [];
        if (this.skinSkeleton && this.cacheSkeletonComponent)
        {
            const joints = this.skinSkeleton.joints;
            const globalMatrices = this.cacheSkeletonComponent.globalMatrices;
            for (let i = joints.length - 1; i >= 0; i--)
            {
                skeletonGlobalMatriices[i] = globalMatrices[joints[i][0]].clone();
                if (this.initMatrix)
                {
                    skeletonGlobalMatriices[i].prepend(this.initMatrix);
                }
            }
        }
        else
        {
            skeletonGlobalMatriices = defaultSkeletonGlobalMatriices;
        }

        return skeletonGlobalMatriices;
    }
}

const defaultSkeletonGlobalMatriices: Matrix4x4[] = (() =>
{
    const v = [new Matrix4x4()]; let i = 150; while (i-- > 1) v.push(v[0]);

    return v;
})();

export class SkinSkeleton
{
    /**
     * [在整个骨架中的编号，骨骼名称]
     */
    @serialize
    joints: [number, string][] = [];
    /**
     * 当前模型包含骨骼数量
     */
    @serialize
    numJoint = 0;
}

export class SkinSkeletonTemp extends SkinSkeleton
{
    /**
     * temp 解析时临时数据
     */
    cache_map: { [oldjointid: number]: number } = {};

    resetJointIndices(jointIndices: number[], skeleton: SkeletonComponent)
    {
        const len = jointIndices.length;
        for (let i = 0; i < len; i++)
        {
            if (this.cache_map[jointIndices[i]] === undefined)
            { this.cache_map[jointIndices[i]] = this.numJoint++; }
            jointIndices[i] = this.cache_map[jointIndices[i]];
        }

        this.joints.length = 0;
        for (const key in this.cache_map)
        {
            if (this.cache_map.hasOwnProperty(key))
            {
                this.joints[this.cache_map[key]] = [parseInt(key, 10), skeleton.joints[key].name];
            }
        }
    }
}
