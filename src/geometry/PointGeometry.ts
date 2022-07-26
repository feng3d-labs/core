import { Color4, Vector2, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { watch } from '@feng3d/watcher';
import { Geometry } from './Geometry';

declare global
{
    export interface MixinsGeometryTypes
    {
        PointGeometry: PointGeometry
    }
}

/**
 * 点几何体
 */
export class PointGeometry extends Geometry
{
    __class__: 'feng3d.PointGeometry';

    /**
     * 点数据列表
     * 修改数组内数据时需要手动调用 invalidateGeometry();
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    points: PointInfo[] = [];

    /**
     * 构建几何体
     */
    buildGeometry()
    {
        let numPoints = this.points.length;
        const indices: number[] = [];
        const positionData: number[] = [];
        const normalData: number[] = [];
        const uvData: number[] = [];
        const colors: number[] = [];

        numPoints = Math.max(1, numPoints);

        for (let i = 0; i < numPoints; i++)
        {
            const element = this.points[i];
            const position = (element && element.position) || Vector3.ZERO;
            const color = (element && element.color) || Color4.WHITE;
            const normal = (element && element.normal) || Vector3.ZERO;
            const uv = (element && element.uv) || Vector2.zero;
            indices[i] = i;
            positionData.push(position.x, position.y, position.z);
            normalData.push(normal.x, normal.y, normal.z);
            uvData.push(uv.x, uv.y);
            colors.push(color.r, color.g, color.b, color.a);
        }
        this.positions = positionData;
        this.uvs = uvData;
        this.normals = normalData;
        this.indices = indices;
        this.colors = colors;
    }
}

/**
 * 点信息
 */
export interface PointInfo
{
    position?: Vector3;
    color?: Color4;
    normal?: Vector3;
    uv?: Vector2;
}
