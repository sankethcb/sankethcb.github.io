export {gamepads, pollGamepads, setGamepadConnectionEvents};

let gamepads = [];

let numPads = 0;

function pollGamepads() 
{
	//Handle both prefixed version and standard version of getGamepads
	let pollPads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);

	for (let i = 0; i < pollPads.length; i++) 
	{
		for(let j = 0; j < numPads; j++)
		{
			if(pollPads[i] != null && gamepads[j].index == pollPads[i].index)
			{
				gamepads[j] = pollPads[i]; //Update the matching gamepad
				break;
			}
		}
	}
}

//Handles gamepads being connected or disconnected
function gamepadHandler(event, connecting)
{
	let eventPad = event.gamepad;

	if(connecting) //Connecting
	{
		if(eventPad.mapping == 'standard')
		{
			if(numPads < 2) //Only allow 2 controllers
			{
				gamepads[numPads] = eventPad;
				numPads++;
				console.log('Controller connected.');
			}
			else
			{
				console.log('Two valid controllers already connected!');
			}
		}
		else
		{
			console.log('This controller does not have a standard mapping.');
		}
	}
	else //Disconnecting
	{
		for(let i = 0; i < numPads; i++)
		{
			//If the gamepad being disconnected was actually one of the player's gamepads
			if(gamepads[i].index == eventPad.index)
			{
				//Remove the gamepad from the array
				gamepads.splice(i, 1);
				numPads--;
				console.log('Gamepad disconnected');
			}
		}
	}
}

function setGamepadConnectionEvents()
{
	window.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
	window.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);
}

