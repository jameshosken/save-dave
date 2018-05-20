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
		Debug.Log("[SocketIO] DATA received: " + e.name);

		if (e.data == null) { return; }

        JSONObject j = e.data;
        mapHandler.SetMapData( ParseMapData(j) );
        mapHandler.PrintMapData();
        mapHandler.ConstructMapWithTiles();
        
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

    int[,] ParseMapData(JSONObject container)
    {
        JSONObject obj = container.list[0];
        //New empty int dual array based on length of rows and length of cols from mapdata
        //rows data in obj.list,
        //cols data in first row, i.e. obj.list[0].list
        int[,] myMap = new int[obj.list.Count, obj.list[0].list.Count];

        int rownum = 0; //keep track of row number
        foreach(JSONObject row in obj.list)
        {
            int colnum = 0; // keep track of col number
            foreach (JSONObject col in row.list)
            {
                myMap[rownum, colnum] = (int) col.n;
                colnum++;
            }
            rownum++;
        }


        return myMap;
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
