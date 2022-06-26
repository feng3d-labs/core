import { Ray3, Vector2, Vector3 } from '@feng3d/math';
import { ObjectUtils } from '@feng3d/polyfill';
import { CullFace } from '@feng3d/renderer';
import { Transform } from '../core/Transform';
import { RayCastable } from '../core/RayCastable';
import { Geometry } from '../geometry/Geometry';

/**
 * 射线投射拾取器
 */
export class Raycaster
{
    /**
     * 获取射线穿过的实体
     * @param ray3D 射线
     * @param transforms 实体列表
     * @return
     */
    pick(ray3D: Ray3, transforms: Transform[])
    {
        if (transforms.length === 0) return null;

        const pickingCollisionVOs = transforms.reduce((pv: PickingCollisionVO[], node3d) =>
        {
            const model = node3d.getComponent(RayCastable);
            const pickingCollisionVO = model && model.worldRayIntersection(ray3D);
            if (pickingCollisionVO) pv.push(pickingCollisionVO);

            return pv;
        }, []);

        if (pickingCollisionVOs.length === 0) return null;

        // 根据与包围盒距离进行排序
        pickingCollisionVOs.sort((a, b) => a.rayEntryDistance - b.rayEntryDistance);

        let shortestCollisionDistance = Number.MAX_VALUE;
        let bestCollisionVO: PickingCollisionVO = null;
        const collisionVOs: PickingCollisionVO[] = [];

        for (let i = 0; i < pickingCollisionVOs.length; ++i)
        {
            const pickingCollisionVO = pickingCollisionVOs[i];
            if (ObjectUtils.objectIsEmpty(bestCollisionVO) || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance)
            {
                const result = pickingCollisionVO.geometry.raycast(pickingCollisionVO.localRay, shortestCollisionDistance, pickingCollisionVO.cullFace);
                if (result)
                {
                    pickingCollisionVO.rayEntryDistance = result.rayEntryDistance;
                    pickingCollisionVO.index = result.index;
                    pickingCollisionVO.localNormal = result.localNormal;
                    pickingCollisionVO.localPosition = result.localPosition;
                    pickingCollisionVO.uv = result.uv;
                    //
                    shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                    collisionVOs.push(pickingCollisionVO);
                    bestCollisionVO = pickingCollisionVO;
                }
            }
        }

        return bestCollisionVO;
    }

    /**
     * 获取射线穿过的实体
     * @param ray3D 射线
     * @param node3ds 实体列表
     * @return
     */
    pickAll(ray3D: Ray3, node3ds: Transform[])
    {
        if (node3ds.length === 0) return [];

        const pickingCollisionVOs = node3ds.reduce((pv: PickingCollisionVO[], node3d) =>
        {
            const model = node3d.getComponent(RayCastable);
            const pickingCollisionVO = model && model.worldRayIntersection(ray3D);
            if (pickingCollisionVO) pv.push(pickingCollisionVO);

            return pv;
        }, []);

        if (pickingCollisionVOs.length === 0) return [];

        const collisionVOs = pickingCollisionVOs.filter((v) =>
        {
            const result = v.geometry.raycast(v.localRay, Number.MAX_VALUE, v.cullFace);
            if (result)
            {
                v.rayEntryDistance = result.rayEntryDistance;
                v.index = result.index;
                v.localNormal = result.localNormal;
                v.localPosition = result.localPosition;
                v.uv = result.uv;

                return true;
            }

            return false;
        });

        return collisionVOs;
    }
}

/**
 * 射线投射拾取器
 */
export const raycaster = new Raycaster();

/**
 * 拾取的碰撞数据
 */
export interface PickingCollisionVO
{
    /**
     * 第一个穿过的物体
     */
    node3d: Transform;

    /**
     * 碰撞的uv坐标
     */
    uv?: Vector2;

    /**
     * 实体上碰撞本地坐标
     */
    localPosition?: Vector3;

    /**
     * 射线顶点到实体的距离
     */
    rayEntryDistance: number;

    /**
     * 本地坐标系射线
     */
    localRay: Ray3;

    /**
     * 本地坐标碰撞法线
     */
    localNormal: Vector3;

    /**
     * 射线坐标是否在边界内
     */
    rayOriginIsInsideBounds: boolean;

    /**
     * 碰撞三角形索引
     */
    index?: number;

    /**
     * 碰撞关联的渲染对象
     */
    geometry: Geometry;

    /**
     * 剔除面
     */
    cullFace: CullFace;
}

