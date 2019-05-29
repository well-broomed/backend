// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const taskModel = require('../models/taskModel');
const instanceModel = require('../models/instanceModel');

const uuidv1 = require('uuid/v1');

const moment = require('moment');
// Routes

/**
 * Get instances by property ID
 */

 router.get('/p/:property_id', checkJwt, checkUserInfo, (req, res) => {
     const property_id = req.params.property_id;

     instanceModel.getByProperty(property_id).then(status => {
         console.log(status);
         return res.status(200).json({instances: status});
     }).catch(err => {
         console.log(err);
         return res.status(200).json({error: `Internal server error.`})
     })
 });

 /**
  * Get by instance UUID
  */

 router.get('/i/:instance_uuid', checkJwt, checkUserInfo, (req, res) => {
    const instance_uuid = req.params.instance_uuid;

    instanceModel.getByInstance(instance_uuid).then(status => {
        console.log(status);
        return res.status(200).json({instances: status});
    }).catch(err => {
        console.log(err);
        return res.status(500).json({error: `Internal server error.`})
    })
 });

/** Get instances by list_id */
router.get('/l/:list_id', checkJwt, checkUserInfo, (req, res) => {

	const list_id = req.params.list_id;

	instanceModel.getByList(list_id).then(status => {
		console.log(status);

		return res.status(200).json({instances: status})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
});

/**
 * Create new instance
 */

router.post('/initialize/:property_id', checkJwt, checkUserInfo, (req, res) => {
    const property_id = req.params.property_id;
    // receives an array of tasks in req.body that will generate an instance for each task
    taskModel.getByProperty(property_id).then(tasks => {
        const tasks = tasks;

        // the guest id will be passed in the body once the trip is confirmed
        const guest_id = req.body.guest_id;
        /**
         * ALTERNATIVELY: the guest will be generated at this point
         */

        // generate a unique identifier for this instance's tasks
        const instance_uuid = uuidv1();

        const current_time = moment();
        const checkin_time = moment(req.body.checkin_time);
        const checkout_time = moment(req.body.checkout_time);

        // iterate over each task and generate an instance for it, storing those instances inside this array
        let instances = [];

        for(let i = 0; i < tasks.length; i++){
            let task = tasks[i];
            task.instance_uuid = instance_uuid;
            task.guest_id = guest_id;
            if(task.list_type === 'after'){
                task.deadline = checkout_time.add(task.hours_after, 'hours');
            } else {
                task.deadline = checkin_time;
            }

            instanceModel.add(task).then(status => {
                console.log('add instance', status);
                instances.push(status[0]);

                // once we reach the last task, return the accumulated instances
                if(i === tasks.length - 1){
                    return res.status(201).json({instances: instances});
                }
            }).catch(err => {
                console.log(err);
                return res.status(500).json({error: `Internal server error.`})
            })
        }
    }).catch(err => {
            console.log(err);
            return res.status(500).json({error: `Internal server error.`})
        })
    })