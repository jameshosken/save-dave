using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TileHandler : MonoBehaviour {

    [SerializeField] GameObject roadEmpty;
    [SerializeField] GameObject roadBlocked;

    Vector2 positionInGrid;

    GameObject tileObject;


    enum TileStatus {Empty, Blocked};   //Setting this as enum rather than bool in case we add more statuses later
    TileStatus tileStatus = TileStatus.Empty;

    private void Start()
    {

    }

    public void SetPositionInGrid(int x, int y)
    {
        positionInGrid = new Vector2(x, y);
        transform.position = new Vector3(positionInGrid.x, 0, positionInGrid.y);
    }

    public void SetEmptyStatus(int status)
    {
        switch (status)
        {
            case 1:
                tileStatus = TileStatus.Blocked;

                break;
            default:
                tileStatus = TileStatus.Empty;
                break;
        }

    }

    public void ConstructTile()
    {
        switch (tileStatus)
        {
            case TileStatus.Blocked:
                tileObject = Instantiate(roadBlocked, transform.position, Quaternion.identity);
                break;
            default:
                tileObject = Instantiate(roadEmpty, transform.position, Quaternion.identity);
                break;
        }
        tileObject.transform.SetParent(this.transform);
    }
}
