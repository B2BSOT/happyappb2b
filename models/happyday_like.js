'"use strict';

module.exports = function(sequelize, DataTypes) {
    var happyday_like = sequelize.define('happyday_like', {
                        happyday_id: {type: DataTypes.INTEGER, primaryKey: true},
                        user_id: {type: DataTypes.INTEGER, primaryKey: true},
                        happyday_like_dtm: {type: DataTypes.STRING, allowNull: true}
                    },{
                        classMethods: {},
                        tableName: 'happyday_like', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return happyday_like;
}