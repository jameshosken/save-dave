using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MapHandler : MonoBehaviour {


    [SerializeField] GameObject tileTemplate;


    //rayList tiles = new ArrayList();

    TileHandler[,] tiles;

    public void SetTilesLength(int x, int y)
    {
        //Nothing
    }

    public void AddNewTile(int x, int y, bool[] walls)
    {
        GameObject tile = Instantiate(tileTemplate.gameObject, transform.position, Quaternion.identity);
        TileHandler tileHandler = tile.GetComponent<TileHandler>();
        tileHandler.SetPosition(x, y);
        tileHandler.SetWalls(walls);
    }

    public void SetStartTile()
    {

    }

}
