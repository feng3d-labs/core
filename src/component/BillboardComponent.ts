import { oav } from '@feng3d/objectview';
import { watch } from '@feng3d/polyfill';
import { Camera } from '../cameras/Camera';
import { RegisterComponent, Component } from './Component';

export interface ComponentMap { BillboardComponent: BillboardComponent; }

@feng3d.AddComponentMenu('Layout/BillboardComponent')
@RegisterComponent()
export class BillboardComponent extends Component
{
    __class__: 'feng3d.BillboardComponent';

    /**
     * 相机
     */
    @oav()
    @watch('_onCameraChanged')
    camera: Camera;

    init()
    {
        super.init();
        this.transform.on('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _onCameraChanged(property: string, oldValue: Camera, value: Camera)
    {
        if (oldValue) oldValue.off('scenetransformChanged', this._invalidHoldSizeMatrix, this);
        if (value) value.on('scenetransformChanged', this._invalidHoldSizeMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _invalidHoldSizeMatrix()
    {
        if (this._gameObject) this.transform['_invalidateSceneTransform']();
    }

    private _onUpdateLocalToWorldMatrix()
    {
        const _localToWorldMatrix = this.transform['_localToWorldMatrix'];
        if (_localToWorldMatrix && this.camera)
        {
            const camera = this.camera;
            const cameraPos = camera.transform.worldPosition;
            const yAxis = camera.transform.localToWorldMatrix.getAxisY();
            _localToWorldMatrix.lookAt(cameraPos, yAxis);
        }
    }

    dispose()
    {
        this.camera = null;
        this.transform.off('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        super.dispose();
    }
}
