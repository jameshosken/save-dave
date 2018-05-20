#region License
/*
 * TestSocketIO.cs
 *
 * The MIT License
 *
 * Copyright (c) 2014 Fabio Panettieri
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
#endregion

using System.Collections;
using UnityEngine;
using SocketIO;
using System.Collections.Generic;

public class SocketHandler : MonoBehaviour
{

	private SocketIOComponent socket;
    private MapHandler mapHandler;
    bool isOpen = false;

	public void Start() 
	{
		socket = gameObject.GetComponent<SocketIOComponent>();
        mapHandler = GameObject.Find("Map").GetComponent<MapHandler>();
        

        //Default socket messages
		socket.On("open", SocketOpen);
		socket.On("error", SocketError);
		socket.On("close", SocketClose);

        //Custom socket messages
        socket.On("mapres", MapDataFromServer);

    }



	public void SocketOpen(SocketIOEvent e)
	{
        //Ensure this function only runs once per session
        if (isOpen) { return; }
		Debug.Log("[SocketIO] Open received: " + e.name);
        isOpen = true;
        socket.Emit("mapreq");
	}
	
	public void MapDataFromServer(SocketIOEvent e)
	{
		Debug.Log("[SocketIO] DATA received: " + e.name + " " + e.data);

		if (e.data == null) { return; }

        JSONObject j = e.data;
        ParseMapData(j);
        /*
        mapHandler.SetMapData( ParseMapData(j) );
        mapHandler.PrintMapData();
        mapHandler.ConstructMapWithTiles();
        */
    }
	
	public void SocketError(SocketIOEvent e)
	{
		Debug.Log("[SocketIO] Error received: " + e.name + " " + e.data);
	}
	
	public void SocketClose(SocketIOEvent e)
	{	
		Debug.Log("[SocketIO] Close received: " + e.name + " " + e.data);
        isOpen = false;
	}

    //////////////////
    //Parser Methods//
    //////////////////

    void ParseMapData(JSONObject container)
    {


        JSONObject obj = container.list[0];
        

        for(int i = 0; i < obj.list.Count; i++)
        {

            JSONObject tile = obj.list[i];
            int inX = 0, inY = 0;
            bool[] inWalls = new bool[4];

            for (int j = 0; j < tile.list.Count; j++)
            {
                JSONObject value = tile.list[j];  
                switch (tile.keys[j])                                   //Parse each tile based on the keys in the JSON object
                {
                    case "x":
                        inX = (int)value.n;                             //JSONObect defaults to float so must cast to int.
                        break;
                    case "y":
                        inY = (int)value.n;
                        break;
                    case "walls":
                        for(int k = 0; k < value.list.Count; k++)
                        {
                            inWalls[k] = value.list[k].b;
                        }
                        break;
                    default:
                        Debug.LogWarning("Unknown key");
                        break;
                }
                
            }
            Debug.Log("Adding tile: " + inX + ", " + inY);
            mapHandler.AddNewTile(inX, inY, inWalls);

        }

        /*
            * Data coming in: 
            * [ {  x: int,
            *      y: int,
            *      walls: [bool,bool,bool,bool]
            *   }, etc
            * ]
            * 
        



        switch (obj.type)
        {
            case JSONObject.Type.OBJECT:
                Debug.Log("IS OBJECT");
                for (int i = 0; i < obj.list.Count; i++)
                {
                    string key = (string)obj.keys[i];
                    JSONObject j = (JSONObject)obj.list[i];
                    Debug.Log(key);
                    if()
                    ParseMapData(j);
                }
                break;
            case JSONObject.Type.ARRAY:
                Debug.Log("IS ARRAY");
                foreach (JSONObject j in obj.list)
                {
                    ParseMapData(j);
                }
                break;
            case JSONObject.Type.STRING:
                Debug.Log("IS STRING");
                Debug.Log(obj.str);
                break;
            case JSONObject.Type.NUMBER:
                Debug.Log("IS NUMBER");
                Debug.Log(obj.n);
                break;
            case JSONObject.Type.BOOL:
                Debug.Log(obj.b);
                break;
            case JSONObject.Type.NULL:
                Debug.Log("NULL");
                break;
        }
        */
    }

    void ParseGeneralJSONData(JSONObject obj)
    {
        switch (obj.type)
        {
            case JSONObject.Type.OBJECT:
                Debug.Log("IS OBJECT");
                for (int i = 0; i < obj.list.Count; i++)
                {
                    string key = (string)obj.keys[i];
                    JSONObject j = (JSONObject)obj.list[i];
                    Debug.Log(key);
                    ParseGeneralJSONData(j);
                }
                break;
            case JSONObject.Type.ARRAY:
                Debug.Log("IS ARRAY");
                foreach (JSONObject j in obj.list)
                {
                    ParseGeneralJSONData(j);
                }
                break;
            case JSONObject.Type.STRING:
                Debug.Log("IS STRING");
                Debug.Log(obj.str);
                break;
            case JSONObject.Type.NUMBER:
                Debug.Log("IS NUMBER");
                Debug.Log(obj.n);
                break;
            case JSONObject.Type.BOOL:
                Debug.Log(obj.b);
                break;
            case JSONObject.Type.NULL:
                Debug.Log("NULL");
                break;
        }
    }
}
