'"use strict';

module.exports = function(sequelize, DataTypes) {
    var com_img = sequelize.define('com_img', {
                        imageurl: {type: DataTypes.STRING, primaryKey: true},
                        deletehash: {type: DataTypes.STRING, allowNull: false},
                        img_source: {type: DataTypes.STRING, allowNull: false},
                        reg_usernum: {type: DataTypes.STRING, allowNull: false},
                        reg_dtm: {type: DataTypes.STRING, allowNull: false},
                        isDisplaying: {type: DataTypes.STRING, allowNull: false}
                    },{
                        classMethods: {},
                        tableName: 'com_img',
                        freezeTableName: true,
                        underscored: true,
                        timestamps: false
                    });
                    
    return com_img;
}


