const db = require('../models'); // refers to /models/index.js
const ObjectId = require('mongoose').Types.ObjectId;

/**
  * Avoid duplication of code between reply-to and create message
  * @param {text} - String, message to create
  * @param {user} - The User's ID that is the message author
  * @return Object of type Message - pre-populated with user data
  */
createMessageHelper = async function(text,user) {
  try {
    // Process the message for hashtags
    let hashtags = extractHashtags(text);
    // Create msg
    let message = await db.Message.create({
      text,
      hashtags,
      user
    });
    let foundUser = await db.User.findById(user);
    foundUser.messages.push(message.id);
    await foundUser.save();
    let foundMessage = await db.Message.findById(message._id).populate('user',{
      username: true,
      profileImageUrl: true
    });
    return foundMessage;
  } catch(e) {
    return e;
  }
}

// Takes a string (possibly including hashtags and returns the hashtags from that string
extractHashtags = function(text) {
return text.split(' ').filter(v=> v.startsWith('#'));
}

/**
  * @param {req} - Request object, assumes the following and inserts the reply and associates it with the parent message
  * req.params.message_id - Parent message to reply to
  * req.body.text         - The new message
  * req.params.id         - User ID of logged in user (who will be doing the replying)
  * @return 200 status and JSON new message, or pass error to next
  */
exports.replyToMessage = async function(req, res, next) {
  try {
    // Create message
    let newMessage = await createMessageHelper(req.body.text,req.params.id);
    // Associate the new message with it's parent
    let parentMessage = await db.Message.findById(req.params.message_id);
    parentMessage.replies.push(newMessage._id);
    await parentMessage.save();
    // Return the new message
    return res.status(200).json(newMessage);
  } catch(e) {
    return next(e);
  }
}

/**
  * @param {req} - Request object, assumes the following and inserts message and returns it once added to database
  * req.body.text         - The new message
  * req.params.id         - User ID of logged in user (who will be doing the replying)
  * @return 200 status and JSON new message, or pass error to next
  */
exports.createMessage = async function(req, res, next) {
  try {
    let newMessage = createMessageHelper(req.body.text,req.params.id);
    return res.status(200).json(newMessage);
  } catch(e) {
    return next(e);
  }
};


/**
 * Main GET function for messages - params documented below are actually query strings
 * @param {mode} String - all = all messages, hashtags = filter by hashtags, users = filter by users
 * @param {q} String - only used if mode is not all, the query to search for
 * @param {limit} Int - limit on messages returned ** if a message has replies these will also be returned
 * @param {orderBy} String - how to order the search results, defaults to 'newest' other options are 'mostReplies'
 * @param {orderDir} String - order direction - asc or desc, defaults to desc
 *
 */
exports.loadMessages = async function(req, res, next) {
  try {
    console.log('-----+++++-----+++++-----+++++-----');
    let { mode = 'all', q = '', limit = 1000, orderBy = 'newest', orderDir = 'desc' } = req.query;
    let messages = [];
    let filterField = '';
    let findStart = {};
    let findEnd = {};
    let sort = {};
    if(limit == 0) { limit = 1000 }

    // Which field is being filtered
    switch(mode) {
      case 'hashtags':
        filterField = 'hashtags';
        // findStart = {[filterField]: `#${q} ` };
        findStart = {[filterField]: { $regex: `#${q}`, $options: 'i' } };
        findEnd   = {};
      break;
      case 'users':
        filterField = 'user.username';
        findStart = {};
        findEnd   = {[filterField]:q};
      break;
    }

    // Sort field and direction
    (orderDir === 'asc' ? orderDir = 1 : orderDir = -1);
    switch(orderBy) {
      case 'mostReplies':
        sortField = 'replyCount';
        sort = {[sortField]: orderDir};
      break;
      case 'newest':
      default:
        sortField = 'createdAt';
        sort = {[sortField]: orderDir};
      break;
    }

    // Build Query using aggregate
    messages = await db.Message.aggregate([
      {
        $match: findStart
      },
      {
        $lookup: {
          from: "users",
          let: {
            userId: "$user"
          },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$userId"] } }
            }
          ],
          as: "userLookup"
        }
      },
      /* Replies Lookup */
      {
        $lookup: {
          from: "messages",
          let: {
            replyMessageId: "$replies"
          },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$replyMessageId"] } } },
            {
              $lookup: {
                from: "users",
                let: {
                  userId: "$user"
                },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$userId"] } } }
                ],
                as: "replyUserLookup"
              }
            },
            {
              $project: {
                _id: 1,
                text: 1,
                hashtags: 1,
                createdAt: 1,
                updatedAt: 1,
                replies: 1,
                user: {
                  _id: { $arrayElemAt: ['$replyUserLookup._id',0] },
                  username: { $arrayElemAt: ['$replyUserLookup.username',0]},
                  profileImageUrl: { $arrayElemAt: ['$replyUserLookup.profileImageUrl',0]}
                }
              }
            },
          ],
          as: "repliesLookup"
        }
      },
      {
        $project: {
          _id: 1,
          replies: 1,
          text: 1,
          hashtags: 1,
          createdAt: 1,
          updatedAt: 1,
          replyCount: {
            $size: "$replies"
          },
          replies: '$repliesLookup',
          user: {
            _id: { $arrayElemAt: ['$userLookup._id',0] },
            username: { $arrayElemAt: ['$userLookup.username',0]},
            profileImageUrl: { $arrayElemAt: ['$userLookup.profileImageUrl',0]}
          }
        }
      },
      {
        $match: findEnd
      },
      {
        $sort: sort
      },
      {
        $limit: Number(limit)
      }
    ]);

    console.log('-----+++++-----+++++-----+++++-----+++++-----+++++-----+++++-----+++++-----');
    return res.status(200).json(messages);
  } catch(e) {
    return next(e);
  }
}



// Takes in req.body.hashtag and returns messages with this hashtag
exports.filterByHashtag = async function(req, res, next) {
  try {
    let messages = await db.Message.find({
      hashtags: `#${req.params.hashtag}`
    })
      .sort({createdAt: 'desc'})
      .populate('user', {
        username: true,
        profileImageUrl: true
      })
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'username profileImageUrl'
        }
      });
      return res.status(200).json(messages);
  } catch(e) {
    return next(e);
  }
}

// Takes in req.body.user and returns messages from this user
exports.filterByUser = async function(req, res, next) {
  try {
    let user_id = await db.User.find({
      "username":req.params.username
    },{_id:1});
    // console.log(user_id[0]._id + "-------");
    let messages = await db.Message.find({
      user: ObjectId(user_id[0]._id)
    })
      .sort({createdAt: 'desc'})
      .populate('user', {
        username: true,
        profileImageUrl: true
      })
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'username profileImageUrl'
        }
      });
      return res.status(200).json(messages);
  } catch(e) {
    return next(e);
  }
}

// Gets all hashtags in the database & return as an array of strings
exports.getHashtags = async function(req, res, next) {
  try {
    let hashtags = await db.Message.find(
      {
        hashtags: {
            $exists: true,
            $not: {$size: 0}
        }
      },
      {
        hashtags: 1,
        _id: 0
      });

    let retHashtags = []
    hashtags.forEach((v) => {
      v.hashtags.forEach((ht) => {
        if(!retHashtags.includes(ht)) {
          retHashtags.push(ht);
        }
      });
    });

    return res.status(200).json(retHashtags);
  } catch(e) {
    return next(e);
  }
}

// Assumes GET  -/api/users/:id/messages/:message_id
exports.getMessage = async function(req, res, next) {
  try {
    let message = await db.Message.findById(req.params.message_id)
    .populate('user', {
      username: true,
      profileImageUrl: true
    })
    .populate('replies');
    return res.status(200).json(message);
  } catch(e) {
    return next(e);
  }
};

exports.updateMessage = async function(req, res, next) {
  try {
    let message = await db.Message.findByIdAndUpdate(req.params.message_id,{ text: req.body.text },{new:true});
    return res.status(200).json(message);
  } catch(e) {
    return next(e);
  }
}

exports.deleteMessage = async function(req, res, next) {
  try {
    // Also need to check if it has replies, if so these need to be removed before the parent message is removed
    let replies = await db.Message.find({_id:req.params.message_id},{replies:1});
    if(replies[0] !== undefined) {
      replies[0].replies.forEach(async function(v,i,a) {
        let replyMsg = await db.Message.findById(v);
        await replyMsg.remove();
        /*await db.Message.findByIdAndRemove(v,function() {
          console.log(v + 'Removed');
        });*/
      });
    }

    /*
     * Have to use this instead of findByIdAndRemove mongoose method, as that wouldn't work with
     * the .pre hook in the models/message.js file which is on the 'remove' method
     */
    let foundMessage = await db.Message.findById(req.params.message_id);
    await foundMessage.remove();
    // Return OK status and the message that was just removed
    return res.status(200).json(foundMessage);
  } catch(e) {
    return next(e);
  }
};


// let message = await db.Message.create({
//   text: req.body.text,
//   /*
//   * When this is called, the user will be logged in - URL will be like /api/users/:id/messages
//   * so can somewhat speculatively assume it will be in request.params
//   */
//   user: req.params.id
// });
// // Find the user so we can push the message ID to the User's messages array, and save user
// let foundUser = await db.User.findById(req.params.id);
// foundUser.messages.push(message.id);
// await foundUser.save();
// /*
//  * This isn't strictly 'creating the message' it's populating the user field on the message document
//  * to contain the 2 fields you need to DISPLAY the message, as this is what the app will do next.
//  * Not convinced this shouldn't be in a separate func... but populate effectively swaps out the
//  * ID being held in the .user field, with the document OF THAT USER so that the return value of
//  * this function is the message complete with a username and profileImageUrl to be displayed
//  */
// let foundMessage = await db.Message.findById(message._id).populate('user', {
//   username: true,
//   profileImageUrl: true
// });
