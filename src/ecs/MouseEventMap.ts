export interface MouseEventMap
{
    /**
     * 鼠标移出对象
     */
    mouseout: { clientX: number, clientY: number }
    /**
     * 鼠标移入对象
     */
    mouseover: { clientX: number, clientY: number }
    /**
     * 鼠标在对象上移动
     */
    mousemove: { clientX: number, clientY: number }
    /**
     * 鼠标左键按下
     */
    mousedown: { clientX: number, clientY: number }
    /**
     * 鼠标左键弹起
     */
    mouseup: { clientX: number, clientY: number }
    /**
     * 单击
     */
    click: { clientX: number, clientY: number }
    /**
     * 鼠标中键按下
     */
    middlemousedown: { clientX: number, clientY: number }
    /**
     * 鼠标中键弹起
     */
    middlemouseup: { clientX: number, clientY: number }
    /**
     * 鼠标中键单击
     */
    middleclick: { clientX: number, clientY: number }
    /**
     * 鼠标右键按下
     */
    rightmousedown: { clientX: number, clientY: number }
    /**
     * 鼠标右键弹起
     */
    rightmouseup: { clientX: number, clientY: number }
    /**
     * 鼠标右键单击
     */
    rightclick: { clientX: number, clientY: number }
    /**
     * 鼠标双击
     */
    dblclick: { clientX: number, clientY: number }
}
