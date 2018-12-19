'"use strict';

module.exports = function(sequelize, DataTypes) {
    var vote_detail = sequelize.define('vote_detail', {
                        vote_id: {type: DataTypes.INTEGER, primaryKey: true},
                        item_id: {type: DataTypes.INTEGER, primaryKey: true},
                        user_id: {type: DataTypes.INTEGER, primaryKey: true},
                        reg_dtm: {type: DataTypes.STRING, allowNull: false},
                    },{
                        classMethods: {
                            // associate: function(models) {
                            //     vote_detail.belongsTo(models.vote_items, {
                            //         foreignkey: ['vote_id', 'item_id']
                            //     });
                            // }
                        },
                        tableName: 'vote_detail',
                        freezeTableName: true,
                        underscored: true,
                        timestamps: false
                    });
                    
    return vote_detail;
}