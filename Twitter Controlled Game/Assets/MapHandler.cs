using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MapHandler : MonoBehaviour {

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
}
