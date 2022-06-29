import { Vector3 } from '@feng3d/math';
import { Transform } from '../core/Transform';
import { ControllerBase } from './ControllerBase';

export class LookAtController extends ControllerBase
{
    protected _lookAtPosition: Vector3;
    protected _lookAtNode3D: Transform;
    protected _origin: Vector3 = new Vector3(0.0, 0.0, 0.0);
    protected _upAxis: Vector3 = Vector3.Y_AXIS;
    protected _pos: Vector3 = new Vector3();

    constructor(node3d?: Transform, Node3D?: Transform)
    {
        super(node3d);

        if (Node3D)
        { this.lookAtObject = Node3D; }
        else
        { this.lookAtPosition = new Vector3(); }
    }

    get upAxis(): Vector3
    {
        return this._upAxis;
    }

    set upAxis(upAxis: Vector3)
    {
        this._upAxis = upAxis;
    }

    get lookAtPosition(): Vector3
    {
        return this._lookAtPosition;
    }

    set lookAtPosition(val: Vector3)
    {
        this._lookAtPosition = val;
    }

    get lookAtObject()
    {
        return this._lookAtNode3D;
    }

    set lookAtObject(value)
    {
        if (this._lookAtNode3D === value)
        { return; }

        this._lookAtNode3D = value;
    }

    update(_interpolate = true): void
    {
        if (this._targetNode)
        {
            if (this._lookAtPosition)
            {
                this._targetNode.lookAt(this.lookAtPosition, this._upAxis);
            }
            else if (this._lookAtNode3D)
            {
                this._pos.copy(this._lookAtNode3D.localPosition);
                this._targetNode.lookAt(this._pos, this._upAxis);
            }
        }
    }
}

