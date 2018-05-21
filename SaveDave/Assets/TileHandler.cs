using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TileHandler : MonoBehaviour {

    [Tooltip("MUST be Up, Right, Down, Left")]
    [SerializeField] GameObject[] walls;
    [SerializeField] GameObject floor;
    [SerializeField] GameObject goal;
    [SerializeField] GameObject label;

    Vector2 positionInGrid;

    bool[] wallsStatus;

    GameObject tileObject;

    Color defaultMaterialColour;
    private void Start()
    {
        defaultMaterialColour = floor.GetComponent<MeshRenderer>().material.color;

    }

    enum TileStatus {Start, End, Occupied, Empty};   
    TileStatus tileStatus = TileStatus.Empty;


   
    public void SetPosition(int x, int y)
    {
        positionInGrid = new Vector2(x, y);
        transform.position = new Vector3(positionInGrid.x, 0, positionInGrid.y);
        label.GetComponent<TextMesh>().text = x.ToString() + "," +  y.ToString();
    }

    public void SetWalls(bool[] wallData)
    {
        wallsStatus = wallData;
        for (int i = 0; i < walls.Length; i++)
        {
                walls[i].SetActive(wallsStatus[i]);
        }
    }

    /// <summary>
    /// Status setters
    /// </summary>

    public void SetAsStart()
    {
        tileStatus = TileStatus.Start;

        //floor.GetComponent<MeshRenderer>().material.EnableKeyword("_EMISSION");
        //floor.GetComponent<MeshRenderer>().material.SetColor("_EmissionColor", Color.red);
    }

    public void SetAsEnd()
    {
        tileStatus = TileStatus.End;
        //floor.GetComponent<MeshRenderer>().material.EnableKeyword("_EMISSION");

        //floor.GetComponent<MeshRenderer>().material.SetColor("_EmissionColor", Color.green);
        goal.SetActive(true);
    }

    public void SetAsEmpty()
    {
        tileStatus = TileStatus.Empty;
        floor.GetComponent<MeshRenderer>().material.color = defaultMaterialColour;
    }

    public void SetAsOccupied()
    {
        tileStatus = TileStatus.Occupied;
        floor.GetComponent<MeshRenderer>().material.color = Color.green;
    }

    public void ToggleLabel()
    {

        label.SetActive(!label.activeSelf);
    }

}
