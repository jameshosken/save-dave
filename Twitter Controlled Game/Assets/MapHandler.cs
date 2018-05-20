using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MapHandler : MonoBehaviour {


    [SerializeField] TileHandler tileTemplate;
    int[,] mapData;

    public void SetMapData(int[,] inData)
    {
        mapData = inData;
    }

    public void PrintMapData()
    {
        for (int i = 0; i < mapData.GetLength(0); i++)
        {
            string row = "";
            for (int j = 0; j < mapData.GetLength(1); j++)
            {
                row += mapData[i, j].ToString();
            }
            print(row);
        }
    }

    public void ConstructMapWithTiles()
    {
        for (int x = 0; x < mapData.GetLength(0); x++)
        {
            for (int y = 0; y < mapData.GetLength(1); y++)
            {
                GameObject tile = Instantiate(tileTemplate.gameObject, transform.position, Quaternion.identity);
                tile.transform.SetParent(this.transform);
                TileHandler tileHandler = tile.GetComponent<TileHandler>();
                tileHandler.SetPositionInGrid(x, y);
                tileHandler.SetEmptyStatus(mapData[x, y]);
                tileHandler.ConstructTile();
            }
        }
    }


}
