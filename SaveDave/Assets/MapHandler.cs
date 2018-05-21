using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MapHandler : MonoBehaviour {

    [SerializeField] GameObject tileTemplate;



    //rayList tiles = new ArrayList();

    TileHandler[,] tiles;

    public void SetMapSize(int x, int y)
    {
        //Refresh called, delete old tiles
        if (tiles != null)
        {
            foreach (TileHandler tile in tiles)
            {
                GameObject.Destroy(tile.gameObject);
            }
        }

        tiles = new TileHandler[x, y];
    }

    public void AddNewTile(int x, int y, bool[] walls)
    {

        GameObject tile = Instantiate(tileTemplate.gameObject, transform.position, Quaternion.identity);
        tile.transform.SetParent(transform);
        TileHandler tileHandler = tile.GetComponent<TileHandler>();
        tileHandler.SetPosition(x, y);
        tileHandler.SetWalls(walls);

        tiles[x, y] = tileHandler;
    }

    public void SetStartTile(int x, int y)
    {
        tiles[x, y].SetAsStart();
    }

    public void SetEndTile(int x, int y)
    {
        tiles[x, y].SetAsEnd();
    }

    public void ToggleLabels()
    {
        foreach (TileHandler tile in tiles)
        {
            tile.ToggleLabel();
        }
    }

}
