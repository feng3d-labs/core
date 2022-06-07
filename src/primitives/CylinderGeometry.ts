import { Entity } from '@feng3d/ecs';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { watch } from '@feng3d/watcher';
import { Geometry } from '../geometry/Geometry';

declare global
{
    interface MixinsGeometryTypes
    {
        CylinderGeometry: CylinderGeometry
    }
}

/**
 * 圆柱体几何体
 * @author DawnKing 2016-09-12
 */
export class CylinderGeometry extends Geometry
{
    __class__: 'feng3d.CylinderGeometry' | 'feng3d.ConeGeometry';

    /**
     * 顶部半径
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    topRadius = 0.5;

    /**
     * 底部半径
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    bottomRadius = 0.5;

    /**
     * 高度
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    height = 2;

    /**
     * 横向分割数
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    segmentsW = 16;

    /**
     * 纵向分割数
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    segmentsH = 1;

    /**
     * 顶部是否封口
     */
    @oav()
    @serialize
    @watch('invalidateGeometry')
    topClosed = true;

    /**
     * 底部是否封口
     */
    @oav()
    @serialize
    @watch('invalidateGeometry')
    bottomClosed = true;

    /**
     * 侧面是否封口
     */
    @oav()
    @serialize
    @watch('invalidateGeometry')
    surfaceClosed = true;

    /**
     * 是否朝上
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    yUp = true;

    protected _name = 'Cylinder';

    /**
     * 构建几何体数据
     */
    protected buildGeometry()
    {
        let i: number; let j: number; let index = 0;
        let x: number; let y: number; let z: number; let radius: number; let revolutionAngle = 0;

        let comp1: number; let comp2: number;
        let startIndex = 0;
        let t1: number; let t2: number;

        const vertexPositionData: number[] = [];
        const vertexNormalData: number[] = [];
        const vertexTangentData: number[] = [];

        const revolutionAngleDelta = 2 * Math.PI / this.segmentsW;

        // 顶部
        if (this.topClosed && this.topRadius > 0)
        {
            z = -0.5 * this.height;

            for (i = 0; i <= this.segmentsW; ++i)
            {
                // 中心顶点
                if (this.yUp)
                {
                    t1 = 1;
                    t2 = 0;
                    comp1 = -z;
                    comp2 = 0;
                }
                else
                {
                    t1 = 0;
                    t2 = -1;
                    comp1 = 0;
                    comp2 = z;
                }

                addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);

                // 旋转顶点
                revolutionAngle = i * revolutionAngleDelta;
                x = this.topRadius * Math.cos(revolutionAngle);
                y = this.topRadius * Math.sin(revolutionAngle);

                if (this.yUp)
                {
                    comp1 = -z;
                    comp2 = y;
                }
                else
                {
                    comp1 = y;
                    comp2 = z;
                }

                if (i === this.segmentsW)
                {
                    addVertex(vertexPositionData[startIndex + 3], vertexPositionData[startIndex + 4], vertexPositionData[startIndex + 5],
                        0, t1, t2, 1, 0, 0);
                }
                else
                {
                    addVertex(x, comp1, comp2,
                        0, t1, t2, 1, 0, 0);
                }
            }
        }

        // 底部
        if (this.bottomClosed && this.bottomRadius > 0)
        {
            z = 0.5 * this.height;
            startIndex = index;
            for (i = 0; i <= this.segmentsW; ++i)
            {
                // 中心顶点
                if (this.yUp)
                {
                    t1 = -1;
                    t2 = 0;
                    comp1 = -z;
                    comp2 = 0;
                }
                else
                {
                    t1 = 0;
                    t2 = 1;
                    comp1 = 0;
                    comp2 = z;
                }

                addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);

                // 旋转顶点
                revolutionAngle = i * revolutionAngleDelta;
                x = this.bottomRadius * Math.cos(revolutionAngle);
                y = this.bottomRadius * Math.sin(revolutionAngle);

                if (this.yUp)
                {
                    comp1 = -z;
                    comp2 = y;
                }
                else
                {
                    comp1 = y;
                    comp2 = z;
                }

                if (i === this.segmentsW)
                {
                    addVertex(x, vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2],
                        0, t1, t2, 1, 0, 0);
                }
                else
                {
                    addVertex(x, comp1, comp2,
                        0, t1, t2, 1, 0, 0);
                }
            }
        }

        // 侧面
        const dr = this.bottomRadius - this.topRadius;
        const latNormElev = dr / this.height;
        const latNormBase = (latNormElev === 0) ? 1 : this.height / dr;

        if (this.surfaceClosed)
        {
            let na0: number; let na1: number; let naComp1: number; let naComp2: number;

            for (j = 0; j <= this.segmentsH; ++j)
            {
                radius = this.topRadius - ((j / this.segmentsH) * (this.topRadius - this.bottomRadius));
                z = -(this.height / 2) + (j / this.segmentsH * this.height);

                startIndex = index;
                for (i = 0; i <= this.segmentsW; ++i)
                {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = radius * Math.cos(revolutionAngle);
                    y = radius * Math.sin(revolutionAngle);
                    na0 = latNormBase * Math.cos(revolutionAngle);
                    na1 = latNormBase * Math.sin(revolutionAngle);

                    if (this.yUp)
                    {
                        t1 = 0;
                        t2 = -na0;
                        comp1 = -z;
                        comp2 = y;
                        naComp1 = latNormElev;
                        naComp2 = na1;
                    }
                    else
                    {
                        t1 = -na0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                        naComp1 = na1;
                        naComp2 = latNormElev;
                    }

                    if (i === this.segmentsW)
                    {
                        addVertex(vertexPositionData[startIndex], vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2],
                            na0, latNormElev, na1,
                            na1, t1, t2);
                    }
                    else
                    {
                        addVertex(x, comp1, comp2,
                            na0, naComp1, naComp2,
                            -na1, t1, t2);
                    }
                }
            }
        }

        this.positions = vertexPositionData;
        this.normals = vertexNormalData;
        this.tangents = vertexTangentData;

        function addVertex(px: number, py: number, pz: number, nx: number, ny: number, nz: number, tx: number, ty: number, tz: number)
        {
            vertexPositionData[index] = px;
            vertexPositionData[index + 1] = py;
            vertexPositionData[index + 2] = pz;

            vertexNormalData[index] = nx;
            vertexNormalData[index + 1] = ny;
            vertexNormalData[index + 2] = nz;

            vertexTangentData[index] = tx;
            vertexTangentData[index + 1] = ty;
            vertexTangentData[index + 2] = tz;

            index += 3;
        }

        //
        const uvData = this.buildUVs();
        this.uvs = uvData;

        const indices = this.buildIndices();
        this.indices = indices;
    }

    /**
     * 构建顶点索引
     */
    private buildIndices()
    {
        let i: number; let j: number; let
            index = 0;

        const indices: number[] = [];
        let numIndices = 0;
        // 顶部
        if (this.topClosed && this.topRadius > 0)
        {
            for (i = 0; i <= this.segmentsW; ++i)
            {
                index += 2;
                if (i > 0)
                { addTriangleClockWise(index - 1, index - 3, index - 2); }
            }
        }

        // 底部
        if (this.bottomClosed && this.bottomRadius > 0)
        {
            for (i = 0; i <= this.segmentsW; ++i)
            {
                index += 2;
                if (i > 0)
                { addTriangleClockWise(index - 2, index - 3, index - 1); }
            }
        }

        // 侧面
        if (this.surfaceClosed)
        {
            let a: number; let b: number; let c: number; let
                d: number;
            for (j = 0; j <= this.segmentsH; ++j)
            {
                for (i = 0; i <= this.segmentsW; ++i)
                {
                    index++;
                    if (i > 0 && j > 0)
                    {
                        a = index - 1;
                        b = index - 2;
                        c = b - this.segmentsW - 1;
                        d = a - this.segmentsW - 1;

                        addTriangleClockWise(a, b, c);
                        addTriangleClockWise(a, c, d);
                    }
                }
            }
        }

        return indices;

        function addTriangleClockWise(cwVertexIndex0: number, cwVertexIndex1: number, cwVertexIndex2: number)
        {
            indices[numIndices++] = cwVertexIndex0;
            indices[numIndices++] = cwVertexIndex1;
            indices[numIndices++] = cwVertexIndex2;
        }
    }

    /**
     * 构建uv
     */
    private buildUVs()
    {
        let i: number; let
            j: number;
        let x: number; let y: number; let
            revolutionAngle: number;

        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / this.segmentsW;
        let index = 0;

        // 顶部
        if (this.topClosed)
        {
            for (i = 0; i <= this.segmentsW; ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);

                // 中心顶点
                data[index++] = 0.5;
                data[index++] = 0.5;
                // 旋转顶点
                data[index++] = x;
                data[index++] = y;
            }
        }
        // 底部
        if (this.bottomClosed)
        {
            for (i = 0; i <= this.segmentsW; ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);

                // 中心顶点
                data[index++] = 0.5;
                data[index++] = 0.5;
                // 旋转顶点
                data[index++] = x;
                data[index++] = y;
            }
        }
        // 侧面
        if (this.surfaceClosed)
        {
            for (j = 0; j <= this.segmentsH; ++j)
            {
                for (i = 0; i <= this.segmentsW; ++i)
                {
                    // 旋转顶点
                    data[index++] = (i / this.segmentsW);
                    data[index++] = (j / this.segmentsH);
                }
            }
        }

        return data;
    }
}

declare global
{
    interface MixinsDefaultGeometry
    {
        Cylinder: CylinderGeometry;
    }
    interface MixinsPrimitiveEntity
    {
        Cylinder: Entity;
    }
}

Geometry.setDefault('Cylinder', new CylinderGeometry());

// Entity.registerPrimitive('Cylinder', (g) =>
// {
//     g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Cylinder');
// });
