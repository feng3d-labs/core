import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { watch } from '@feng3d/watcher';
import { GameObject } from '../core/GameObject';
import { MeshRenderer } from '../core/MeshRenderer';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare global
{
    export interface MixinsGeometryTypes
    {
        CapsuleGeometry: CapsuleGeometry
    }

    export interface MixinsDefaultGeometry
    {
        Capsule: CapsuleGeometry;
    }

    export interface MixinsPrimitiveGameObject
    {
        Capsule: GameObject;
    }
}

/**
 * 胶囊体几何体
 */
export class CapsuleGeometry extends Geometry
{
    __class__: 'feng3d.CapsuleGeometry';

    /**
     * 胶囊体半径
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    radius = 0.5;

    /**
     * 胶囊体高度
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    height = 1;

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
    segmentsH = 15;

    /**
     * 正面朝向 true:Y+ false:Z+
     */
    @serialize
    @oav()
    @watch('invalidateGeometry')
    yUp = true;

    name = 'Capsule';

    /**
     * 构建几何体数据
     * @param radius 胶囊体半径
     * @param height 胶囊体高度
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     * @param yUp 正面朝向 true:Y+ false:Z+
     */
    protected buildGeometry()
    {
        const vertexPositionData: number[] = [];
        const vertexNormalData: number[] = [];
        const vertexTangentData: number[] = [];

        let startIndex: number;
        let index = 0;
        let comp1: number; let comp2: number; let t1: number; let
            t2: number;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            startIndex = index;

            const horangle = Math.PI * yi / this.segmentsH;
            const z = -this.radius * Math.cos(horangle);
            const ringradius = this.radius * Math.sin(horangle);

            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                const verangle = 2 * Math.PI * xi / this.segmentsW;
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                const tanLen = Math.sqrt(y * y + x * x);
                const offset = yi > this.segmentsH / 2 ? this.height / 2 : -this.height / 2;

                if (this.yUp)
                {
                    t1 = 0;
                    t2 = tanLen > 0.007 ? x / tanLen : 0;
                    comp1 = -z;
                    comp2 = y;
                }
                else
                {
                    t1 = tanLen > 0.007 ? x / tanLen : 0;
                    t2 = 0;
                    comp1 = y;
                    comp2 = z;
                }

                if (xi === this.segmentsW)
                {
                    vertexPositionData[index] = vertexPositionData[startIndex];
                    vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                    vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];

                    vertexNormalData[index] = (vertexNormalData[startIndex] + x * normLen) * 0.5;
                    vertexNormalData[index + 1] = (vertexNormalData[startIndex + 1] + comp1 * normLen) * 0.5;
                    vertexNormalData[index + 2] = (vertexNormalData[startIndex + 2] + comp2 * normLen) * 0.5;

                    vertexTangentData[index] = (vertexTangentData[startIndex] + tanLen > 0.007 ? -y / tanLen : 1) * 0.5;
                    vertexTangentData[index + 1] = (vertexTangentData[startIndex + 1] + t1) * 0.5;
                    vertexTangentData[index + 2] = (vertexTangentData[startIndex + 2] + t2) * 0.5;
                }
                else
                {
                    vertexPositionData[index] = x;
                    vertexPositionData[index + 1] = this.yUp ? comp1 - offset : comp1;
                    vertexPositionData[index + 2] = this.yUp ? comp2 : comp2 + offset;

                    vertexNormalData[index] = x * normLen;
                    vertexNormalData[index + 1] = comp1 * normLen;
                    vertexNormalData[index + 2] = comp2 * normLen;

                    vertexTangentData[index] = tanLen > 0.007 ? -y / tanLen : 1;
                    vertexTangentData[index + 1] = t1;
                    vertexTangentData[index + 2] = t2;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === this.segmentsH)
                    {
                        vertexPositionData[index] = vertexPositionData[startIndex];
                        vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                        vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                    }
                }

                index += 3;
            }
        }
        this.positions = vertexPositionData;
        this.normals = vertexNormalData;
        this.tangents = vertexTangentData;

        const uvData = this.buildUVs();
        this.uvs = uvData;

        this.buildIndices();
    }

    /**
     * 构建顶点索引
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     * @param yUp 正面朝向 true:Y+ false:Z+
     */
    private buildIndices()
    {
        const indices: number[] = [];

        let numIndices = 0;
        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                if (xi > 0 && yi > 0)
                {
                    const a = (this.segmentsW + 1) * yi + xi;
                    const b = (this.segmentsW + 1) * yi + xi - 1;
                    const c = (this.segmentsW + 1) * (yi - 1) + xi - 1;
                    const d = (this.segmentsW + 1) * (yi - 1) + xi;

                    if (yi === this.segmentsH)
                    {
                        indices[numIndices++] = a;
                        indices[numIndices++] = c;
                        indices[numIndices++] = d;
                    }
                    else if (yi === 1)
                    {
                        indices[numIndices++] = a;
                        indices[numIndices++] = b;
                        indices[numIndices++] = c;
                    }
                    else
                    {
                        indices[numIndices++] = a;
                        indices[numIndices++] = b;
                        indices[numIndices++] = c;
                        indices[numIndices++] = a;
                        indices[numIndices++] = c;
                        indices[numIndices++] = d;
                    }
                }
            }
        }
        this.indices = indices;
    }

    /**
     * 构建uv
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     */
    private buildUVs()
    {
        const data: number[] = [];
        let index = 0;

        for (let yi = 0; yi <= this.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= this.segmentsW; ++xi)
            {
                data[index++] = xi / this.segmentsW;
                data[index++] = yi / this.segmentsH;
            }
        }

        return data;
    }
}

Geometry.setDefault('Capsule', new CapsuleGeometry());

GameObject.registerPrimitive('Capsule', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Capsule');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Capsule',
        priority: -3,
        click: () =>
            GameObject.createPrimitive('Capsule')
    }
);

