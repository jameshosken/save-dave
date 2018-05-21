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
using UnitySocketIO;
using UnitySocketIO.Events;
using System.Collections.Generic;
using UnityEngine.UI;
using System;


public class SocketHandler : MonoBehaviour
{

    [SerializeField] Text tweetRoll;

    [SerializeField] int maxTweetsInRoll;

    public SocketIOController socket;

    private MapHandler mapHandler;
    private PlayerMovement playerMovement;
    bool isOpen = false;

    Queue<string> tweetTexts = new Queue<string>();
    Queue<string> tweetNames = new Queue<string>();

    [SerializeField] Text connections;
    [SerializeField] Text mazeSize;
    [SerializeField] GameObject winScreen;
    [SerializeField] Text namesText;

    public void Start() 
	{
		socket = gameObject.GetComponent<SocketIOController>();
        Debug.Log(socket);
        mapHandler = GameObject.Find("Map").GetComponent<MapHandler>();
        playerMovement = GameObject.FindGameObjectWithTag("Player").GetComponent<PlayerMovement>();


        //Default socket messages

        socket.On("connect", SocketOpen);
		socket.On("open", SocketOpen);
        socket.On("ping", SocketPing);
        
        socket.On("error", SocketError);
		socket.On("close", SocketClose);

        //Custom socket messages
        socket.On("mapres", MapDataFromServer);
        socket.On("newmove", PositionDataFromServer);
        //socket.On("newtweet", TweetDataFromServer);

        socket.On("tweets", TweetDataFromServer);

        socket.On("win", WinDataFromServer);

        socket.Connect();
    }


    public void SendCheatCode()
    {
        socket.Emit("cheatcode");
    }
	public void SocketOpen(SocketIOEvent e)
	{
        //Ensure this function only runs once per session
        if (isOpen) { return; }
		//Debug.Log("[SocketIO] Open received: " + e.name);
        isOpen = true;
        socket.Emit("mapreq");
	}

    public void SocketPing(SocketIOEvent e)
    {
        //Debug.Log("[SocketIO] Ping received");
        JSONObject j = new JSONObject(e.data);
        ParsePing(j);

    }

    

    public void MapDataFromServer(SocketIOEvent e)
	{

		//Debug.Log("[SocketIO] DATA received: " + e.name + " " + e.data);

		if (e.data == null) { return; }

        JSONObject j = new JSONObject(e.data);
        ParseMapData(j);

        socket.Emit("posreq");
    }

    public void PositionDataFromServer(SocketIOEvent e)
    {
        //Debug.Log("[SocketIO] DATA received: " + e.name + " " + e.data);

        if (e.data == null) { return; }

        JSONObject j = new JSONObject( e.data);
        ParsePositionData(j);

    }

    public void TweetDataFromServer(SocketIOEvent e)
    {
        //Debug.Log("[SocketIO] DATA received: " + e.name + " " + e.data);

        if (e.data == null) { return; }

        JSONObject j = new JSONObject(e.data);
        ParseTweetData(j);
    }

    public void WinDataFromServer(SocketIOEvent e)
    {
        Debug.Log("[SocketIO] WIN received: " + e.name + " " + e.data);

        if (e.data == null) { return; }

        JSONObject j = new JSONObject(e.data);
        ParseWinData(j);
    }



    public void SocketError(SocketIOEvent e)
	{
		//Debug.Log("[SocketIO] Error received: " + e.name + " " + e.data);
	}
	
	public void SocketClose(SocketIOEvent e)
	{	
		//Debug.Log("[SocketIO] Close received: " + e.name + " " + e.data);
        isOpen = false;
	}

    //////////////////
    //Parser Methods//
    //////////////////

    void ParseMapData(JSONObject container)
    {
        //Handle Map Size
        //print("Handle Map Size");
        JSONObject obj = container.list[1];
        //Debug.Log(obj);

        mapHandler.SetMapSize((int)obj.list[0].n, (int)obj.list[1].n);
        mazeSize.text = "Maze size: " + (int)obj.list[0].n + "x" + (int)obj.list[1].n;

        //Handle Map Data
        //print("Handle Map Data");
        obj = container.list[0];
        
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
            //Debug.Log("Adding tile: " + inX + ", " + inY);
            mapHandler.AddNewTile(inX, inY, inWalls);

        }

        //Handle Start tile
        //print("Handle Start Tile");
        obj = container.list[2];
        //Debug.Log(obj);

        mapHandler.SetStartTile((int)obj.list[0].n, (int)obj.list[1].n);

        //Handle End Tile
        //print("Handle End Tile");
        obj = container.list[3];
        //Debug.Log(obj);

        mapHandler.SetEndTile((int)obj.list[0].n, (int)obj.list[1].n);

    }

    void ParsePositionData(JSONObject obj)
    {

        //Handle Position Data
        //print("Handle Position Data");
        //Debug.Log(obj);

        playerMovement.SetPlayerPosition((int)obj.list[0].n, (int)obj.list[1].n);


    }

    private void ParseTweetData(JSONObject j)
    {


        tweetRoll.text = "";

        //Debug.Log("Parsing tweet");
        //Debug.Log(j);
        JSONObject arr = j.list[0];
        //Debug.Log(arr);

        for(int i = 0; i < arr.Count; i++)
        {
            tweetRoll.text += "Tweet: " + arr.list[i].list[1].str + "\nBy " + arr.list[i].list[0].str + "\n\n";
        }
        

    }

    private void ParsePing(JSONObject j)
    {
        int cnxns = (int) j.list[0].n;

        connections.text = "People viewing Dave: " + cnxns;
    }

    private void ParseWinData(JSONObject j)
    {
        Debug.Log("Parsing win data");
        winScreen.SetActive(true);

        // Names array data will the list contained in the first list: list[0].list
        Debug.Log(j);
        namesText.text = "\nList of people who helped Dave:\n\n";
        List<string> names = new List<string>();
        for (int i = 0; i < j.list.Count; i++)
        {
            names.Add(j.list[0].list[i].str);
            namesText.text += names[i] + "\n\n";
        }

        namesText.text += "\n\n";
        



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