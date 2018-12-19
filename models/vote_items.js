'"use strict';

module.exports = function(sequelize, DataTypes) {
    var vote_items = sequelize.define('vote_items', {
                        vote_id: {type: DataTypes.INTEGER, primaryKey: true},
                        item_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        item_name: {type: DataTypes.STRING, allowNull: false},
                        reg_user_id: {type: DataTypes.INTEGER, allowNull: false},
                        reg_dtm: {type: DataTypes.STRING, allowNull: false},
                    },{
                        classMethods: {
                            // associate: function(models) {
                            //     vote_items.hasMany(models.vote_detail, {
                            //         foreignkey: ['vote_id', 'item_id']
                            //     });
                            // }
                        },
                        tableName: 'vote_items',
                        freezeTableName: true,
                        underscored: true,
                        timestamps: false
                    });
                    
    return vote_items;
}