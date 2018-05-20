using System.Collections;
using System.Collections.Generic;
using UnityEngine;


[ExecuteInEditMode]
[SelectionBase]
public class SnapToGrid : MonoBehaviour {

	
	// Update is called once per frame
	void Update () {

        gameObject.transform.position = new Vector3(
                Mathf.Round(transform.position.x),
                0,
                Mathf.Round(transform.position.z)
                );
        
	}
}
