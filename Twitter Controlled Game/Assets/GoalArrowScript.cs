using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[ExecuteInEditMode]
public class GoalArrowScript : MonoBehaviour {
    
    

	// Use this for initialization
	void Start () {
	    	
	}
	
	// Update is called once per frame
	void Update () {
        transform.LookAt(new Vector3(0, 0, 0), Vector3.up);
	}
}
