using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TileHandler : MonoBehaviour {

    [Tooltip("MUST be Up, Right, Down, Left")]
    [SerializeField] GameObject[] walls;

    Vector2 positionInGrid;

    bool[] wallsStatus;

    GameObject tileObject;


    enum TileStatus {Empty, Blocked};   //Setting this as enum rather than bool in case we add more statuses later
    TileStatus tileStatus = TileStatus.Empty;


   
    public void SetPosition(int x, int y)
    {
        positionInGrid = new Vector2(x, y);
        transform.position = new Vector3(positionInGrid.x, 0, positionInGrid.y);
    }

    public void SetWalls(bool[] wallData)
    {
        wallsStatus = wallData;
        for (int i = 0; i < walls.Length; i++)
        {
                walls[i].SetActive(wallsStatus[i]);
        }
    }
}
