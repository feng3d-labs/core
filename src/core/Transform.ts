import { IEventTarget } from '@feng3d/event';
import { Box3, Matrix4x4, Quaternion, Ray3, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass, mathUtil } from '@feng3d/polyfill';
import { RenderAtomic } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
import { Camera } from '../cameras/Camera';
import { Component, RegisterComponent } from '../ecs/Component';
import { Scene } from '../scene/Scene';
import { BoundingBox } from './BoundingBox';

declare global
{
    interface MixinsEntityEventMap
    {
        /**
         * 变换矩阵变化
         */
        transformChanged: Transform;
        /**
         *
         */
        updateLocalToWorldMatrix: Transform;

        /**
         * 场景矩阵变化
         */
        scenetransformChanged: Transform;
    }
    interface MixinsComponentMap { Node3D: Transform; }
}

/**
 * 变换
 *
 * 物体的位置、旋转和比例。
 *
 * 场景中的每个对象都有一个变换。它用于存储和操作对象的位置、旋转和缩放。每个转换都可以有一个父元素，它允许您分层应用位置、旋转和缩放
 */
@RegisterComponent({ name: 'Transform', single: true })
@decoratorRegisterClass()
export class Transform extends Component implements IEventTarget
{
    __class__: 'Transform';

    /**
     * 预设资源编号
     */
    @serialize
    prefabId: string;

    /**
     * 资源编号
     */
    @serialize
    assetId: string;

    /**
     * X轴坐标。
     */
    get x()
    {
        return this.localPosition.x;
    }

    set x(v)
    {
        this.localPosition.x = v;
    }

    /**
     * Y轴坐标。
     */
    get y()
    {
        return this.localPosition.y;
    }

    set y(v)
    {
        this.localPosition.y = v;
    }

    /**
     * Z轴坐标。
     */
    get z()
    {
        return this.localPosition.z;
    }

    set z(v)
    {
        this.localPosition.z = v;
    }

    /**
     * X轴旋转角度。
     */
    get rx()
    {
        return this.localEulerAngles.x;
    }

    set rx(v)
    {
        this.localEulerAngles.x = v;
    }

    /**
     * Y轴旋转角度。
     */
    get ry()
    {
        return this.localEulerAngles.y;
    }

    set ry(v)
    {
        this.localEulerAngles.y = v;
    }

    /**
     * Z轴旋转角度。
     */
    get rz()
    {
        return this.localEulerAngles.z;
    }
    set rz(v)
    {
        this.localEulerAngles.z = v;
    }

    /**
     * X轴缩放。
     */
    get sx()
    {
        return this.localScale.x;
    }

    set sx(v)
    {
        this.localScale.x = v;
    }

    /**
     * Y轴缩放。
     */
    get sy()
    {
        return this.localScale.y;
    }

    set sy(v)
    {
        this.localScale.y = v;
    }

    /**
     * Z轴缩放。
     */
    get sz()
    {
        return this.localScale.z;
    }

    set sz(v)
    {
        this.localScale.z = v;
    }

    get parent()
    {
        return this.gameObject.parent?.transform;
    }

    get numChildren()
    {
        return this.gameObject.numChilren;
    }

    get children()
    {
        const children = this.gameObject.children.map((v) => v.transform);

        return children;
    }

    /**
     * 创建一个实体，该类为虚类
     */
    constructor()
    {
        super();

        // 监听位移旋转缩放变化
        watcher.watchobject(this, {
            localPosition: { x: 0, y: 0, z: 0 },
            localEulerAngles: { x: 0, y: 0, z: 0 },
            localScale: { x: 1, y: 1, z: 1 },
        }, this._invalidateTransform, this);

        this._renderAtomic.uniforms.u_modelMatrix = () => this.localToWorldMatrix;
        this._renderAtomic.uniforms.u_ITModelMatrix = () => this.ITlocalToWorldMatrix;
    }

    /**
     * 世界坐标
     */
    get worldPosition()
    {
        return this.localToWorldMatrix.getPosition();
    }

    /**
     * Position of the transform relative to the parent transform.
     */
    /**
     * 相对于父对象的位移。
     */
    @serialize
    @oav()
    localPosition = new Vector3();

    /**
     * The rotation as Euler angles in degrees relative to the parent transform's rotation.
     */
    /**
     * 相对于父对象的欧拉旋转角度。
     */
    @serialize
    @oav()
    localEulerAngles = new Vector3();

    /**
     * The scale of the transform relative to the GameObjects parent.
     */
    /**
     * 相对于父对象的缩放比例。
     */
    @serialize
    @oav()
    localScale = new Vector3(1, 1, 1);

    /**
     * 相对于父对象的四元素旋转。
     */
    get orientation()
    {
        const radian = new Vector3().copy(this.localEulerAngles).scaleNumber(mathUtil.RAD2DEG);
        const quaternion = new Quaternion().fromEuler(radian.x, radian.y, radian.z);

        return quaternion;
    }

    set orientation(value)
    {
        const angles = value.toEulerAngles();
        angles.scaleNumber(mathUtil.RAD2DEG);
        this.localEulerAngles = angles;
    }

    /**
     * 本地变换矩阵
     */
    get matrix()
    {
        if (this._matrixInvalid)
        {
            this._matrixInvalid = false;
            this._updateMatrix();
        }

        return this._matrix;
    }

    set matrix(v)
    {
        const trs = v.toTRS();

        this.localPosition = trs[0];
        this.localEulerAngles = trs[1];
        this.localScale = trs[2];

        this._matrix.fromArray(v.elements);
        this._invalidateTransform();
        this._matrixInvalid = false;
    }

    /**
     * 本地旋转矩阵
     */
    get rotationMatrix()
    {
        if (this._rotationMatrixInvalid)
        {
            this._rotationMatrix.setRotation(this.localEulerAngles);
            this._rotationMatrixInvalid = false;
        }

        return this._rotationMatrix;
    }

    /**
     * 轴对称包围盒
     */
    get boundingBox()
    {
        if (!this._boundingBox)
        {
            this._boundingBox = new BoundingBox(this);
        }

        return this._boundingBox;
    }
    private _boundingBox: BoundingBox;

    moveForward(distance: number)
    {
        this.translateLocal(Vector3.Z_AXIS, distance);
    }

    moveBackward(distance: number)
    {
        this.translateLocal(Vector3.Z_AXIS, -distance);
    }

    moveLeft(distance: number)
    {
        this.translateLocal(Vector3.X_AXIS, -distance);
    }

    moveRight(distance: number)
    {
        this.translateLocal(Vector3.X_AXIS, distance);
    }

    moveUp(distance: number)
    {
        this.translateLocal(Vector3.Y_AXIS, distance);
    }

    moveDown(distance: number)
    {
        this.translateLocal(Vector3.Y_AXIS, -distance);
    }

    translate(axis: Vector3, distance: number)
    {
        const x = axis.x; const y = axis.y; const
            z = axis.z;
        const len = distance / Math.sqrt(x * x + y * y + z * z);
        this.localPosition.x += x * len;
        this.localPosition.y += y * len;
        this.localPosition.z += z * len;
    }

    translateLocal(axis: Vector3, distance: number)
    {
        const x = axis.x; const y = axis.y; const
            z = axis.z;
        const len = distance / Math.sqrt(x * x + y * y + z * z);
        const matrix = this.matrix.clone();
        matrix.prependTranslation(x * len, y * len, z * len);
        const p = matrix.getPosition();
        this.localPosition.x = p.x;
        this.localPosition.y = p.y;
        this.localPosition.z = p.z;
        this._invalidateSceneTransform();
    }

    pitch(angle: number)
    {
        this.rotate(Vector3.X_AXIS, angle);
    }

    yaw(angle: number)
    {
        this.rotate(Vector3.Y_AXIS, angle);
    }

    roll(angle: number)
    {
        this.rotate(Vector3.Z_AXIS, angle);
    }

    rotateTo(ax: number, ay: number, az: number)
    {
        this.localEulerAngles.x = ax;
        this.localEulerAngles.y = ay;
        this.localEulerAngles.z = az;
    }

    /**
     * 绕指定轴旋转，不受位移与缩放影响
     * @param axis 旋转轴
     * @param angle 旋转角度
     * @param pivotPoint 旋转中心点
     *
     */
    rotate(axis: Vector3, angle: number, pivotPoint?: Vector3): void
    {
        // 转换位移
        const positionMatrix = Matrix4x4.fromPosition(this.localPosition.x, this.localPosition.y, this.localPosition.z);
        positionMatrix.appendRotation(axis, angle, pivotPoint);
        const position = positionMatrix.getPosition();
        // 转换旋转
        const rotationMatrix = Matrix4x4.fromRotation(this.localEulerAngles.x, this.localEulerAngles.y, this.localEulerAngles.z);
        rotationMatrix.appendRotation(axis, angle, pivotPoint);
        const newrotation = rotationMatrix.toTRS()[1];
        const v = Math.round((newrotation.x - this.localEulerAngles.x) / 180);
        if (v % 2 !== 0)
        {
            newrotation.x += 180;
            newrotation.y = 180 - newrotation.y;
            newrotation.z += 180;
        }
        //
        const toRound = (a: number, b: number, c = 360) =>
            Math.round((b - a) / c) * c + a;
        newrotation.x = toRound(newrotation.x, this.localEulerAngles.x);
        newrotation.y = toRound(newrotation.y, this.localEulerAngles.y);
        newrotation.z = toRound(newrotation.z, this.localEulerAngles.z);
        //
        this.localPosition = position;
        this.localEulerAngles = newrotation;
        //
        this._invalidateSceneTransform();
    }

    /**
     * 看向目标位置
     *
     * @param target 目标位置
     * @param upAxis 向上朝向
     */
    lookAt(target: Vector3, upAxis?: Vector3)
    {
        this._updateMatrix();
        this._matrix.lookAt(target, upAxis);
        const trs = this._matrix.toTRS();
        //
        this.localPosition = trs[0];
        this.localEulerAngles = trs[1];
        this.localScale = trs[2];
        //
        this._matrixInvalid = false;
    }

    /**
     * 将一个点从局部空间变换到世界空间的矩阵。
     */
    get localToWorldMatrix()
    {
        if (this._localToWorldMatrixInvalid)
        {
            this._localToWorldMatrixInvalid = false;
            this._updateLocalToWorldMatrix();
        }

        return this._localToWorldMatrix;
    }

    set localToWorldMatrix(value)
    {
        value = value.clone();
        this.parent && value.append(this.parent.worldToLocalMatrix);
        this.matrix = value;
    }

    /**
     * 本地转世界逆转置矩阵
     */
    get ITlocalToWorldMatrix()
    {
        if (this._ITlocalToWorldMatrixInvalid)
        {
            this._ITlocalToWorldMatrixInvalid = false;
            this._ITlocalToWorldMatrix.copy(this.localToWorldMatrix);
            this._ITlocalToWorldMatrix.invert().transpose();
        }

        return this._ITlocalToWorldMatrix;
    }

    /**
     * 将一个点从世界空间转换为局部空间的矩阵。
     */
    get worldToLocalMatrix()
    {
        if (this._worldToLocalMatrixInvalid)
        {
            this._worldToLocalMatrixInvalid = false;
            this._worldToLocalMatrix.copy(this.localToWorldMatrix).invert();
        }

        return this._worldToLocalMatrix;
    }

    get localToWorldRotationMatrix()
    {
        if (this._localToWorldRotationMatrixInvalid)
        {
            this._localToWorldRotationMatrix.copy(this.rotationMatrix);
            if (this.parent)
            {
                this._localToWorldRotationMatrix.append(this.parent.localToWorldRotationMatrix);
            }

            this._localToWorldRotationMatrixInvalid = false;
        }

        return this._localToWorldRotationMatrix;
    }

    get worldToLocalRotationMatrix()
    {
        const mat = this.localToWorldRotationMatrix.clone();
        mat.invert();

        return mat;
    }

    /**
     * 将方向从局部空间转换到世界空间。
     *
     * @param direction 局部空间方向
     */
    transformDirection(direction: Vector3)
    {
        direction = this.localToWolrdDirection(direction);

        return direction;
    }

    /**
     * 将方向从局部空间转换到世界空间。
     *
     * @param direction 局部空间方向
     */
    localToWolrdDirection(direction: Vector3)
    {
        if (!this.parent)
        { return direction.clone(); }
        const matrix = this.parent.localToWorldRotationMatrix;
        direction = matrix.transformPoint3(direction);

        return direction;
    }

    /**
     * 将包围盒从局部空间转换到世界空间
     *
     * @param box 变换前的包围盒
     * @param out 变换之后的包围盒
     *
     * @returns 变换之后的包围盒
     */
    localToWolrdBox(box: Box3, out = new Box3())
    {
        if (!this.parent)
        { return out.copy(box); }
        const matrix = this.parent.localToWorldMatrix;
        box.applyMatrixTo(matrix, out);

        return out;
    }

    /**
     * 将位置从局部空间转换为世界空间。
     *
     * @param position 局部空间位置
     */
    transformPoint(position: Vector3)
    {
        position = this.localToWorldPoint(position);

        return position;
    }

    /**
     * 将位置从局部空间转换为世界空间。
     *
     * @param position 局部空间位置
     */
    localToWorldPoint(position: Vector3)
    {
        if (!this.parent)
        { return position.clone(); }
        position = this.parent.localToWorldMatrix.transformPoint3(position);

        return position;
    }

    /**
     * 将向量从局部空间变换到世界空间。
     *
     * @param vector 局部空间向量
     */
    transformVector(vector: Vector3)
    {
        vector = this.localToWorldVector(vector);

        return vector;
    }

    /**
     * 将向量从局部空间变换到世界空间。
     *
     * @param vector 局部空间位置
     */
    localToWorldVector(vector: Vector3)
    {
        if (!this.parent)
        { return vector.clone(); }
        const matrix = this.parent.localToWorldMatrix;
        vector = matrix.transformVector3(vector);

        return vector;
    }

    /**
     * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
     *
     * 将一个方向从世界空间转换到局部空间。
     */
    inverseTransformDirection(direction: Vector3)
    {
        direction = this.worldToLocalDirection(direction);

        return direction;
    }

    /**
     * 将一个方向从世界空间转换到局部空间。
     */
    worldToLocalDirection(direction: Vector3)
    {
        if (!this.parent)
        { return direction.clone(); }
        const matrix = this.parent.localToWorldRotationMatrix.clone().invert();
        direction = matrix.transformPoint3(direction);

        return direction;
    }

    /**
     * 将位置从世界空间转换为局部空间。
     *
     * @param position 世界坐标系中位置
     */
    worldToLocalPoint(position: Vector3, out = new Vector3())
    {
        if (!this.parent)
        { return out.copy(position); }
        position = this.parent.worldToLocalMatrix.transformPoint3(position, out);

        return position;
    }

    /**
     * 将向量从世界空间转换为局部空间
     *
     * @param vector 世界坐标系中向量
     */
    worldToLocalVector(vector: Vector3)
    {
        if (!this.parent)
        { return vector.clone(); }
        vector = this.parent.worldToLocalMatrix.transformVector3(vector);

        return vector;
    }

    /**
     * 将 Ray3 从世界空间转换为局部空间。
     *
     * @param worldRay 世界空间射线。
     * @param localRay 局部空间射线。
     */
    rayWorldToLocal(worldRay: Ray3, localRay = new Ray3())
    {
        this.worldToLocalMatrix.transformRay(worldRay, localRay);

        return localRay;
    }

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
    {
        Object.assign(renderAtomic.uniforms, this._renderAtomic.uniforms);
    }

    /**
     * 销毁
     */
    destroy()
    {
        super.destroy();
    }

    protected readonly _matrix = new Matrix4x4();
    protected _matrixInvalid = false;

    protected readonly _rotationMatrix = new Matrix4x4();
    protected _rotationMatrixInvalid = false;

    protected readonly _localToWorldMatrix = new Matrix4x4();
    protected _localToWorldMatrixInvalid = false;

    protected readonly _ITlocalToWorldMatrix = new Matrix4x4();
    protected _ITlocalToWorldMatrixInvalid = false;

    protected readonly _worldToLocalMatrix = new Matrix4x4();
    protected _worldToLocalMatrixInvalid = false;

    protected readonly _localToWorldRotationMatrix = new Matrix4x4();
    protected _localToWorldRotationMatrixInvalid = false;

    private _renderAtomic = new RenderAtomic();

    private _onPositionChanged()
    {
        this._invalidateTransform();
    }

    private _rotationChanged()
    {
        this._invalidateTransform();
    }

    private _scaleChanged()
    {
        this._invalidateTransform();
    }

    private _invalidateTransform()
    {
        if (this._matrixInvalid) return;
        this._matrixInvalid = true;
        this._rotationMatrixInvalid = true;

        this.emit('transformChanged', this);
        this._invalidateSceneTransform();
    }

    _invalidateSceneTransform()
    {
        if (this._localToWorldMatrixInvalid) return;

        this._localToWorldMatrixInvalid = true;
        this._worldToLocalMatrixInvalid = true;
        this._ITlocalToWorldMatrixInvalid = true;
        this._localToWorldRotationMatrixInvalid = true;

        this.emit('scenetransformChanged', this);
        //
        if (this.gameObject)
        {
            for (let i = 0, n = this.numChildren; i < n; i++)
            {
                this.children[i]._invalidateSceneTransform();
            }
        }
    }

    private _updateMatrix()
    {
        this._matrix.fromTRS(this.localPosition, this.localEulerAngles, this.localScale);
    }

    private _updateLocalToWorldMatrix()
    {
        this._localToWorldMatrix.copy(this.matrix);
        if (this.parent)
        { this._localToWorldMatrix.append(this.parent.localToWorldMatrix); }
        this.emit('updateLocalToWorldMatrix', this);
        console.assert(!isNaN(this._localToWorldMatrix.elements[0]));
    }

    getBubbleTargets(): any[]
    {
        return [this.parent];
    }
}
