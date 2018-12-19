'"use strict';

module.exports = function(sequelize, DataTypes) {
    var happyday_post = sequelize.define('happyday_post', {
                        post_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        happyday_id: {type: DataTypes.INTEGER, allowNull: false},
                        user_id: {type: DataTypes.INTEGER, allowNull: false},
                        post_title: {type: DataTypes.STRING, allowNull: false},
                        post_content: {type: DataTypes.STRING, allowNull: false},
                        reg_dtm: {type: DataTypes.STRING, allowNull: true},
                        modify_dtm: {type: DataTypes.STRING, allowNull: true},
                        post_count: {type: DataTypes.STRING, allowNull: true}
                    },{
                        classMethods: {},
                        tableName: 'happyday_post', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return happyday_post;
}