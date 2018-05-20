using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MapData : MonoBehaviour {

    public int mapData;


    public static MapData CreateFromJSON(string json)
    {
        return JsonUtility.FromJson<MapData>(json);
    }
}
