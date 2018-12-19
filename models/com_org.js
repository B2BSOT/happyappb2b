'"use strict';

module.exports = function(sequelize, DataTypes) {
    var com_org = sequelize.define('com_org', {
                        org_id:       {type: DataTypes.INTEGER, primaryKey: true},
                        org_nm:       {type: DataTypes.STRING, allowNull: true},
                        org_level:    {type: DataTypes.INTEGER, allowNull: false},
                        upper_org_id: {type: DataTypes.INTEGER, allowNull: false},
                    },{
                        classMethods: {},
                        tableName: 'com_org',
                        freezeTableName: true,
                        underscored: true,
                        timestamps: false
                    });
                    
    return com_org;
}
